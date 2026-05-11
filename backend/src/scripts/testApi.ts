// ────────────────────────────────────────────────────────────
// Maya HRMS — API & Database Validation Script
// ────────────────────────────────────────────────────────────
// Verifies database integrity (tables, FKs, seed data) and
// then runs API smoke tests against a running server.
// ────────────────────────────────────────────────────────────

import pool from '../config/database';
import type { RowDataPacket } from 'mysql2/promise';

function colorize(text: string, color: 'green' | 'red' | 'yellow' | 'cyan' | 'bold' | 'gray'): string {
  const codes: Record<string, string> = {
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
    cyan: '\x1b[36m', bold: '\x1b[1m', gray: '\x1b[90m',
  };
  return `${codes[color]}${text}\x1b[0m`;
}

const EXPECTED_TABLES = [
  'companies', 'work_schedules', 'employees', 'users', 'templates',
  'generated_documents', 'time_entries', 'absences', 'leave_types',
  'leave_requests', 'leave_balances', 'public_holidays', 'audit_logs',
];

const EXPECTED_FK_COUNT = 26; // Total FK constraints across all tables

let passed = 0;
let failed = 0;

function pass(label: string) {
  passed++;
  console.log(`  ${colorize('✅', 'green')} ${label}`);
}

function fail(label: string, detail?: string) {
  failed++;
  console.log(`  ${colorize('❌', 'red')} ${label}`);
  if (detail) console.log(`     ${colorize(detail, 'gray')}`);
}

// ────────────────────────────────────────────────────────────
// Phase 1: Database structure validation
// ────────────────────────────────────────────────────────────

async function validateDatabase() {
  console.log(colorize('\n═══ Phase 1: Database Structure Validation ═══\n', 'bold'));
  const conn = await pool.getConnection();

  try {
    // 1. Check all expected tables exist
    console.log(colorize('📋 Tables:', 'bold'));
    const [tables] = await conn.execute<RowDataPacket[]>('SHOW TABLES');
    const tableNames = tables.map((row) => Object.values(row)[0] as string);

    for (const expected of EXPECTED_TABLES) {
      if (tableNames.includes(expected)) {
        pass(`Table "${expected}" exists`);
      } else {
        fail(`Table "${expected}" is MISSING`);
      }
    }

    // Check _migrations tracking table
    if (tableNames.includes('_migrations')) {
      pass('Migration tracking table "_migrations" exists');
    } else {
      fail('Migration tracking table "_migrations" is MISSING');
    }

    // 2. Check foreign key constraints
    console.log(colorize('\n🔗 Foreign Key Constraints:', 'bold'));
    const [fks] = await conn.execute<RowDataPacket[]>(`
      SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
      FROM information_schema.TABLE_CONSTRAINTS tc
      JOIN information_schema.KEY_COLUMN_USAGE kcu USING (CONSTRAINT_NAME, TABLE_SCHEMA)
      WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND tc.TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `);

    if (fks.length >= EXPECTED_FK_COUNT) {
      pass(`${fks.length} foreign key constraints found (expected ≥${EXPECTED_FK_COUNT})`);
    } else {
      fail(`Only ${fks.length} foreign key constraints found (expected ≥${EXPECTED_FK_COUNT})`);
    }

    // Show FK summary by table
    const fkByTable = new Map<string, number>();
    for (const fk of fks) {
      const table = fk.TABLE_NAME as string;
      fkByTable.set(table, (fkByTable.get(table) || 0) + 1);
    }
    for (const [table, count] of fkByTable) {
      console.log(`    ${colorize('→', 'cyan')} ${table}: ${count} FK(s)`);
    }

    // 3. Check migration records
    console.log(colorize('\n📦 Migration History:', 'bold'));
    const [migrations] = await conn.execute<RowDataPacket[]>(
      'SELECT filename, applied_at FROM _migrations ORDER BY id ASC'
    );

    if (migrations.length > 0) {
      pass(`${migrations.length} migration(s) recorded`);
      for (const m of migrations) {
        const date = new Date(m.applied_at).toISOString().substring(0, 19);
        console.log(`    ${colorize('→', 'cyan')} ${m.filename} ${colorize(`(${date})`, 'gray')}`);
      }
    } else {
      fail('No migrations recorded in _migrations table');
    }

    // 4. Check essential seed data
    console.log(colorize('\n🌱 Seed Data:', 'bold'));

    const [companies] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM companies');
    if (Number(companies[0].count) > 0) {
      pass(`${companies[0].count} company/ies seeded`);
    } else {
      fail('No companies found — seeds may not have run');
    }

    const [users] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
    if (Number(users[0].count) > 0) {
      pass(`${users[0].count} user(s) seeded`);
    } else {
      fail('No users found — admin seed may not have run');
    }

    const [leaveTypes] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM leave_types');
    if (Number(leaveTypes[0].count) > 0) {
      pass(`${leaveTypes[0].count} leave type(s) seeded`);
    } else {
      fail('No leave types found — seed 002 may not have run');
    }

    const [holidays] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM public_holidays');
    if (Number(holidays[0].count) > 0) {
      pass(`${holidays[0].count} public holiday(s) seeded`);
    } else {
      fail('No public holidays found — seed 003 may not have run', 'yellow');
    }

    const [tmpls] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM templates');
    if (Number(tmpls[0].count) > 0) {
      pass(`${tmpls[0].count} template(s) seeded`);
    } else {
      fail('No templates found — seed 004 may not have run');
    }

    // 5. FK integrity spot-check: try to insert with bad FK
    console.log(colorize('\n🛡️  FK Enforcement Test:', 'bold'));
    try {
      await conn.execute(
        "INSERT INTO employees (company_id, first_name, last_name, hire_date) VALUES ('nonexistent-id', 'Test', 'FK', '2026-01-01')"
      );
      // If we get here, FK is NOT enforced
      fail('FK not enforced — insert with invalid company_id succeeded!');
      // Clean up
      await conn.execute("DELETE FROM employees WHERE first_name = 'Test' AND last_name = 'FK'");
    } catch (error: any) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        pass('FK enforced — insert with invalid company_id correctly rejected');
      } else {
        fail(`Unexpected error during FK test: ${error.message}`);
      }
    }

  } finally {
    conn.release();
  }
}

// ────────────────────────────────────────────────────────────
// Phase 2: API smoke tests
// ────────────────────────────────────────────────────────────

async function testApi() {
  console.log(colorize('\n═══ Phase 2: API Smoke Tests ═══\n', 'bold'));
  const baseUrl = 'http://localhost:3000/api';

  // Check if server is running
  try {
    await fetch(`${baseUrl}/auth/me`);
  } catch {
    console.log(colorize('  ⚠️  Server not running at localhost:3000 — skipping API tests.', 'yellow'));
    console.log(colorize('     Start the server with "npm run dev" and re-run.\n', 'gray'));
    return;
  }

  // 1. LOGIN
  console.log(colorize('🔐 Auth:', 'bold'));
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hrms.com', password: 'Admin@1234' }),
  });

  const loginData = await loginRes.json() as any;
  if (loginRes.status !== 200) {
    fail(`Login failed: ${JSON.stringify(loginData)}`);
    return; // Can't continue without a token
  }

  const token = loginData.data.accessToken;
  const user = loginData.data.user;
  pass(`Login successful (${user.email}, role: ${user.role})`);

  // 2. ME
  const meRes = await fetch(`${baseUrl}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (meRes.status === 200) {
    pass('GET /auth/me');
  } else {
    fail('GET /auth/me', `Status: ${meRes.status}`);
  }

  // 3. EMPLOYEES
  console.log(colorize('\n👥 Employees:', 'bold'));
  const empRes = await fetch(`${baseUrl}/employees`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const empData = await empRes.json() as any;
  if (empRes.status === 200) {
    pass(`GET /employees (${empData.data?.length || 0} records)`);
  } else {
    fail('GET /employees', `Status: ${empRes.status}`);
  }

  // 4. CREATE EMPLOYEE
  const newEmp = {
    firstName: 'Test',
    lastName: 'Validation',
    email: `test.validation.${Date.now()}@example.com`,
    hireDate: '2026-01-01',
    contractType: 'CDI',
    department: 'QA',
    salary: 10000,
  };
  const createRes = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(newEmp),
  });
  const createData = await createRes.json() as any;
  if (createRes.status === 201) {
    pass(`POST /employees (created ID: ${createData.data?.id})`);
  } else {
    fail('POST /employees', JSON.stringify(createData));
  }

  // 5. LEAVE TYPES
  console.log(colorize('\n🏖️  Leave Types:', 'bold'));
  const ltRes = await fetch(`${baseUrl}/leave-types`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const ltData = await ltRes.json() as any;
  if (ltRes.status === 200) {
    pass(`GET /leave-types (${ltData.data?.length || 0} types)`);
  } else {
    fail('GET /leave-types', `Status: ${ltRes.status}`);
  }

  // 6. USERS
  console.log(colorize('\n👤 Users:', 'bold'));
  const usersRes = await fetch(`${baseUrl}/users`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const usersData = await usersRes.json() as any;
  if (usersRes.status === 200) {
    pass(`GET /users (${usersData.data?.length || 0} users)`);
  } else {
    fail('GET /users', `Status: ${usersRes.status}`);
  }
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────

async function main() {
  console.log(colorize('\n🧪 Maya HRMS — Validation Suite\n', 'bold'));

  await validateDatabase();
  await testApi();

  // Summary
  console.log(colorize('\n═══ Summary ═══\n', 'bold'));
  console.log(`  ${colorize(`✅ Passed: ${passed}`, 'green')}`);
  if (failed > 0) {
    console.log(`  ${colorize(`❌ Failed: ${failed}`, 'red')}`);
  } else {
    console.log(`  ${colorize('❌ Failed: 0', 'green')}`);
  }

  const verdict = failed === 0
    ? colorize('\n🎉 ALL CHECKS PASSED!\n', 'green')
    : colorize(`\n⚠️  ${failed} CHECK(S) FAILED — review above.\n`, 'red');
  console.log(verdict);

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

main();
