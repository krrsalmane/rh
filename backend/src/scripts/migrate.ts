import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import pool from '../config/database';
import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// ────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────
const MIGRATIONS_DIR = resolve(__dirname, '../database/migrations');
const SEEDS_DIR = resolve(__dirname, '../database/seeds');

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function splitSqlStatements(sql: string): string[] {
  // Remove single-line comments but preserve strings
  const withoutComments = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  return withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function colorize(text: string, color: 'green' | 'red' | 'yellow' | 'cyan' | 'gray' | 'bold'): string {
  const codes: Record<string, string> = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
  };
  return `${codes[color]}${text}\x1b[0m`;
}

function elapsed(start: number): string {
  return `${(Date.now() - start)}ms`;
}

// ────────────────────────────────────────────────────────────
// Migration tracking table
// ────────────────────────────────────────────────────────────

async function ensureTrackingTable(conn: PoolConnection): Promise<void> {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(conn: PoolConnection): Promise<string[]> {
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT filename FROM _migrations ORDER BY id ASC'
  );
  return rows.map((r) => r.filename as string);
}

function getMigrationFiles(): string[] {
  if (!existsSync(MIGRATIONS_DIR)) return [];
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();
}

function getSeedFiles(): string[] {
  if (!existsSync(SEEDS_DIR)) return [];
  return readdirSync(SEEDS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

// ────────────────────────────────────────────────────────────
// Core: Run pending migrations
// ────────────────────────────────────────────────────────────

async function runMigrations(conn: PoolConnection, dryRun: boolean): Promise<void> {
  await ensureTrackingTable(conn);
  const applied = await getAppliedMigrations(conn);
  const allFiles = getMigrationFiles();
  const pending = allFiles.filter((f) => !applied.includes(f));

  if (pending.length === 0) {
    console.log(colorize('✅ Nothing to migrate — all migrations are up to date.', 'green'));
    return;
  }

  console.log(`\n${colorize('📋 Pending migrations:', 'bold')}`);
  pending.forEach((f) => console.log(`  ⏳ ${f}`));
  console.log('');

  if (dryRun) {
    console.log(colorize('🔍 Dry run — no changes applied.', 'yellow'));
    return;
  }

  for (const file of pending) {
    const start = Date.now();
    const filePath = resolve(MIGRATIONS_DIR, file);
    const sql = readFileSync(filePath, 'utf-8');
    const statements = splitSqlStatements(sql);

    console.log(`🔄 Applying ${colorize(file, 'cyan')}...`);

    // Use savepoint-based approach since MySQL DDL causes implicit commit
    try {
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
        try {
          await conn.execute(stmt);
          const isLast = i === statements.length - 1;
          const prefix = isLast ? '└─' : '├─';
          console.log(`  ${prefix} Statement ${i + 1}/${statements.length}: ${colorize(preview + '...', 'gray')}  ✅`);
        } catch (error: any) {
          const code = error?.code;
          // Allow idempotent re-runs for index/column already exists
          if (code === 'ER_DUP_KEYNAME' || code === 'ER_DUP_FIELDNAME') {
            const isLast = i === statements.length - 1;
            const prefix = isLast ? '└─' : '├─';
            console.log(`  ${prefix} Statement ${i + 1}/${statements.length}: ${colorize(preview + '... (already exists, skipped)', 'yellow')}`);
            continue;
          }
          throw error;
        }
      }

      // Record successful migration
      await conn.execute(
        'INSERT INTO _migrations (filename) VALUES (?)',
        [file]
      );

      console.log(colorize(`✅ ${file} applied (${elapsed(start)})`, 'green'));
    } catch (error: any) {
      console.error(colorize(`\n❌ Migration ${file} FAILED at statement:`, 'red'));
      console.error(colorize(`   Error: ${error.message}`, 'red'));
      if (error.code) console.error(colorize(`   MySQL code: ${error.code}`, 'red'));
      console.error(colorize(`\n⛔ Migration process stopped. Fix the error and re-run.`, 'red'));
      throw error;
    }
  }

  console.log(colorize(`\n✅ All ${pending.length} migration(s) applied successfully.`, 'green'));
}

// ────────────────────────────────────────────────────────────
// Core: Run seeds
// ────────────────────────────────────────────────────────────

async function runSeeds(conn: PoolConnection): Promise<void> {
  const seedFiles = getSeedFiles();

  if (seedFiles.length === 0) {
    console.log(colorize('ℹ️  No seed files found.', 'yellow'));
    return;
  }

  console.log(`\n${colorize('🌱 Running seeds...', 'bold')}`);

  for (const file of seedFiles) {
    const filePath = resolve(SEEDS_DIR, file);
    const sql = readFileSync(filePath, 'utf-8');
    const statements = splitSqlStatements(sql);

    try {
      for (const statement of statements) {
        await conn.execute(statement);
      }
      console.log(`  ✅ Seed: ${colorize(file, 'cyan')}`);
    } catch (error: any) {
      console.error(colorize(`  ❌ Seed ${file} failed: ${error.message}`, 'red'));
      throw error;
    }
  }

  console.log(colorize('✅ All seeds completed successfully.', 'green'));
}

// ────────────────────────────────────────────────────────────
// Core: Rollback last migration
// ────────────────────────────────────────────────────────────

async function rollbackLast(conn: PoolConnection): Promise<void> {
  await ensureTrackingTable(conn);
  const applied = await getAppliedMigrations(conn);

  if (applied.length === 0) {
    console.log(colorize('ℹ️  Nothing to rollback — no migrations have been applied.', 'yellow'));
    return;
  }

  const lastFile = applied[applied.length - 1];
  const downFile = lastFile.replace('.sql', '.down.sql');
  const downPath = resolve(MIGRATIONS_DIR, downFile);

  if (!existsSync(downPath)) {
    console.error(colorize(`❌ Cannot rollback ${lastFile}: no ${downFile} file found.`, 'red'));
    console.error(colorize('   Create the rollback file and try again.', 'red'));
    process.exit(1);
  }

  const start = Date.now();
  console.log(`\n🔄 Rolling back ${colorize(lastFile, 'cyan')}...`);

  const sql = readFileSync(downPath, 'utf-8');
  const statements = splitSqlStatements(sql);

  try {
    for (const statement of statements) {
      await conn.execute(statement);
    }

    await conn.execute('DELETE FROM _migrations WHERE filename = ?', [lastFile]);
    console.log(colorize(`✅ Rolled back ${lastFile} (${elapsed(start)})`, 'green'));
  } catch (error: any) {
    console.error(colorize(`❌ Rollback of ${lastFile} failed: ${error.message}`, 'red'));
    throw error;
  }
}

// ────────────────────────────────────────────────────────────
// Core: Rollback all migrations
// ────────────────────────────────────────────────────────────

async function rollbackAll(conn: PoolConnection): Promise<void> {
  await ensureTrackingTable(conn);
  const applied = await getAppliedMigrations(conn);

  if (applied.length === 0) {
    console.log(colorize('ℹ️  Nothing to rollback — no migrations have been applied.', 'yellow'));
    return;
  }

  console.log(`\n${colorize(`🔄 Rolling back all ${applied.length} migration(s)...`, 'bold')}`);

  // Rollback in reverse order
  for (let i = applied.length - 1; i >= 0; i--) {
    const file = applied[i];
    const downFile = file.replace('.sql', '.down.sql');
    const downPath = resolve(MIGRATIONS_DIR, downFile);

    if (!existsSync(downPath)) {
      console.error(colorize(`❌ Cannot rollback ${file}: no ${downFile} file found. Stopping.`, 'red'));
      process.exit(1);
    }

    const sql = readFileSync(downPath, 'utf-8');
    const statements = splitSqlStatements(sql);

    for (const statement of statements) {
      await conn.execute(statement);
    }

    await conn.execute('DELETE FROM _migrations WHERE filename = ?', [file]);
    console.log(`  ✅ Rolled back: ${colorize(file, 'cyan')}`);
  }

  console.log(colorize('\n✅ All migrations rolled back.', 'green'));
}

// ────────────────────────────────────────────────────────────
// Core: Show migration status
// ────────────────────────────────────────────────────────────

async function showStatus(conn: PoolConnection): Promise<void> {
  await ensureTrackingTable(conn);

  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT filename, applied_at FROM _migrations ORDER BY id ASC'
  );
  const appliedMap = new Map(rows.map((r) => [r.filename, r.applied_at]));
  const allFiles = getMigrationFiles();

  console.log(`\n${colorize('📋 Migration status:', 'bold')}\n`);

  if (allFiles.length === 0) {
    console.log('  No migration files found.');
    return;
  }

  for (const file of allFiles) {
    const appliedAt = appliedMap.get(file);
    if (appliedAt) {
      const date = new Date(appliedAt).toISOString().replace('T', ' ').substring(0, 19);
      console.log(`  ${colorize('✅', 'green')} ${file}  ${colorize(`(applied ${date})`, 'gray')}`);
    } else {
      console.log(`  ${colorize('⏳', 'yellow')} ${file}  ${colorize('(pending)', 'yellow')}`);
    }
  }

  const pending = allFiles.filter((f) => !appliedMap.has(f));
  console.log(`\n  Total: ${allFiles.length} | Applied: ${rows.length} | Pending: ${pending.length}\n`);
}

// ────────────────────────────────────────────────────────────
// CLI Entry Point
// ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'up';

  const conn = await pool.getConnection();

  try {
    switch (command) {
      case 'up':
      case '--up': {
        const dryRun = args.includes('--dry-run');
        await runMigrations(conn, dryRun);
        if (!args.includes('--no-seed')) {
          await runSeeds(conn);
        }
        break;
      }
      case '--rollback':
        await rollbackLast(conn);
        break;

      case '--rollback-all':
        await rollbackAll(conn);
        break;

      case '--status':
        await showStatus(conn);
        break;

      case '--seed-only':
        await runSeeds(conn);
        break;

      case '--migrate-only':
        await runMigrations(conn, false);
        break;

      default:
        console.log(`
${colorize('Maya HRMS — Database Migration Tool', 'bold')}

Usage: ts-node src/scripts/migrate.ts [command] [options]

Commands:
  up              Run pending migrations + seeds (default)
  --migrate-only  Run pending migrations without seeds
  --seed-only     Run seed files only
  --rollback      Rollback the last applied migration
  --rollback-all  Rollback all applied migrations
  --status        Show migration status

Options:
  --dry-run       Show what would run without executing
  --no-seed       Skip seeds when running 'up'
        `);
        break;
    }
  } finally {
    conn.release();
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
