import pool from '../config/database';
import type { RowDataPacket } from 'mysql2/promise';

// ────────────────────────────────────────────────────────────
// Fresh Install: drops everything and rebuilds from scratch
// ────────────────────────────────────────────────────────────

const TABLES_DROP_ORDER = [
  'audit_logs',
  'public_holidays',
  'leave_balances',
  'leave_requests',
  'leave_types',
  'absences',
  'time_entries',
  'generated_documents',
  'templates',
  'users',
  'employees',
  'work_schedules',
  'companies',
  '_migrations',
];

function colorize(text: string, color: 'green' | 'red' | 'yellow' | 'cyan' | 'bold'): string {
  const codes: Record<string, string> = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
  };
  return `${codes[color]}${text}\x1b[0m`;
}

async function freshInstall() {
  const args = process.argv.slice(2);
  const autoConfirm = args.includes('--yes') || args.includes('-y');
  const withFakeData = args.includes('--with-fake-data');

  if (!autoConfirm) {
    console.log(colorize('\n⚠️  WARNING: This will DROP all tables and recreate the database from scratch!', 'yellow'));
    console.log('   All existing data will be lost.\n');

    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const answer = await new Promise<string>((resolve) => {
      rl.question('   Type "yes" to continue: ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log(colorize('\n❌ Aborted.', 'red'));
      process.exit(0);
    }
  }

  const conn = await pool.getConnection();
  const startTime = Date.now();

  try {
    console.log(colorize('\n🔄 Starting fresh database installation...', 'bold'));

    // Step 1: Drop all tables
    console.log('\n📦 Step 1/3: Dropping existing tables...');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Get actual tables in the database
    const [existingTables] = await conn.execute<RowDataPacket[]>('SHOW TABLES');
    const dbName = Object.keys(existingTables[0] || {})[0];
    const tableNames = existingTables.map((row) => Object.values(row)[0] as string);

    for (const table of TABLES_DROP_ORDER) {
      if (tableNames.includes(table)) {
        await conn.execute(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`  🗑️  Dropped: ${colorize(table, 'cyan')}`);
      }
    }

    // Drop any remaining tables not in our list
    for (const table of tableNames) {
      if (!TABLES_DROP_ORDER.includes(table)) {
        await conn.execute(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`  🗑️  Dropped (extra): ${colorize(table, 'cyan')}`);
      }
    }

    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log(colorize('  ✅ All tables dropped.', 'green'));

    // Step 2: Run migrations
    console.log('\n📦 Step 2/3: Running migrations...');
    conn.release();
    await pool.end();

    // Import and run migrations via child process (reuses migrate.ts logic)
    const { execSync } = await import('child_process');
    const migrateCmd = 'npx ts-node src/scripts/migrate.ts up --no-seed';
    execSync(migrateCmd, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });

    // Step 3: Run seeds
    console.log('\n📦 Step 3/3: Running seeds...');
    const seedCmd = 'npx ts-node src/scripts/migrate.ts --seed-only';
    execSync(seedCmd, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });

    // Optional: Run fake data seeder
    if (withFakeData) {
      console.log('\n📦 Bonus: Seeding fake test data...');
      const fakeCmd = 'npx ts-node src/scripts/seedFakeData.ts';
      execSync(fakeCmd, {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: process.env,
      });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(colorize(`\n🎉 Fresh installation completed in ${elapsed}s!`, 'green'));
    console.log(`\n📋 What was set up:`);
    console.log(`  • 13 database tables with enforced FK constraints`);
    console.log(`  • Admin user: ${colorize('admin@hrms.com', 'cyan')} / ${colorize('Admin@1234', 'cyan')}`);
    console.log(`  • Default leave types (Congé Annuel, Maladie, Maternité, Sans Solde)`);
    console.log(`  • 15 Moroccan public holidays (2026)`);
    console.log(`  • 3 document templates (Attestation travail, salaire, Contrat CDI)`);
    if (withFakeData) {
      console.log(`  • 7 test employees with users across all roles`);
      console.log(`  • Sample leave requests, absences, time entries, and audit logs`);
    }
    console.log(`\n🚀 Start the server: ${colorize('npm run dev', 'bold')}\n`);

  } catch (error: any) {
    console.error(colorize(`\n❌ Fresh install failed: ${error.message}`, 'red'));
    process.exit(1);
  }
}

freshInstall()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
