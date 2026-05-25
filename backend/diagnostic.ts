import { query } from './src/config/database';

async function diagnose() {
  try {
    // Get the company ID (assuming you're using a test/default company)
    const companies = await query('SELECT id, name FROM companies LIMIT 1');
    if (!companies.rows.length) {
      console.log('No companies found');
      return;
    }

    const companyId = companies.rows[0].id;
    console.log(`\n✓ Using company: ${companies.rows[0].name} (${companyId})`);

    // Check total employee count
    const totalCount = await query(
      'SELECT COUNT(*) as total, COUNT(DISTINCT id) as unique_count FROM employees WHERE company_id = $1',
      [companyId]
    );

    const total = parseInt(totalCount.rows[0].total);
    const unique = parseInt(totalCount.rows[0].unique_count);

    console.log(`\n📊 Employee Count:`);
    console.log(`  Total rows: ${total}`);
    console.log(`  Unique IDs: ${unique}`);
    console.log(`  Duplicates: ${total - unique}`);

    // Check for duplicate emails
    const emailDupes = await query(
      `SELECT email, COUNT(*) as count FROM employees 
       WHERE company_id = $1 AND email IS NOT NULL 
       GROUP BY email HAVING COUNT(*) > 1
       ORDER BY count DESC LIMIT 10`,
      [companyId]
    );

    if (emailDupes.rows.length) {
      console.log(`\n⚠️  Duplicate Emails Found (${emailDupes.rows.length}):`);
      for (const row of emailDupes.rows) {
        console.log(`  ${row.email}: ${row.count} records`);
      }
    } else {
      console.log(`\n✓ No duplicate emails found`);
    }

    // Check work_schedules impact
    const workScheduleImpact = await query(
      `SELECT 
        e.id, 
        e.first_name, 
        e.last_name, 
        COUNT(ws.id) as schedule_count
      FROM employees e
      LEFT JOIN work_schedules ws ON e.work_schedule_id = ws.id
      WHERE e.company_id = $1
      GROUP BY e.id, e.first_name, e.last_name
      HAVING COUNT(ws.id) > 1
      LIMIT 10`,
      [companyId]
    );

    if (workScheduleImpact.rows.length) {
      console.log(`\n⚠️  Employees with Multiple Work Schedules:`);
      for (const row of workScheduleImpact.rows) {
        console.log(`  ${row.first_name} ${row.last_name}: ${row.schedule_count} schedules`);
      }
    } else {
      console.log(`\n✓ No employees with multiple work schedules`);
    }

    // Test the DISTINCT COUNT query
    const testCount = await query(
      `SELECT COUNT(DISTINCT e.id) as count FROM employees e WHERE e.company_id = $1`,
      [companyId]
    );

    console.log(`\nTest COUNT(DISTINCT e.id): ${testCount.rows[0].count}`);

    console.log('\n✅ Diagnostics complete\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

diagnose();
