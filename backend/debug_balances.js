// Debug script to check leave balance issues
const mysql = require('mysql2/promise');

async function debugLeaveBalances() {
  try {
    console.log('🔍 Debugging leave balance system...\n');
    
    // Database connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrms_db',
      port: 3306
    });
    
    // 1. Check if employees exist
    const [employees] = await connection.execute('SELECT COUNT(*) as count FROM employees');
    console.log(`📊 Employees in database: ${(employees[0].count)}`);
    
    if (employees[0].count > 0) {
      const [sampleEmployees] = await connection.execute('SELECT id, first_name, last_name, company_id FROM employees LIMIT 3');
      console.log('👥 Sample employees:');
      sampleEmployees.forEach((emp, i) => {
        console.log(`   ${i+1}. ${emp.first_name} ${emp.last_name} (ID: ${emp.id}, Company: ${emp.company_id})`);
      });
    }
    
    // 2. Check if leave types exist
    const [leaveTypes] = await connection.execute('SELECT COUNT(*) as count FROM leave_types');
    console.log(`\n📊 Leave types in database: ${(leaveTypes[0].count)}`);
    
    if (leaveTypes[0].count > 0) {
      const [sampleTypes] = await connection.execute('SELECT id, name, days_per_year, company_id FROM leave_types LIMIT 3');
      console.log('🏷️ Sample leave types:');
      sampleTypes.forEach((lt, i) => {
        console.log(`   ${i+1}. ${lt.name} (${lt.days_per_year || 'N/A'} days, Company: ${lt.company_id})`);
      });
    }
    
    // 3. Check if leave balances exist
    const [balances] = await connection.execute('SELECT COUNT(*) as count FROM leave_balances');
    console.log(`\n📊 Leave balances in database: ${(balances[0].count)}`);
    
    if (balances[0].count > 0) {
      const [sampleBalances] = await connection.execute(`
        SELECT lb.*, e.first_name, e.last_name, lt.name as leave_type_name
        FROM leave_balances lb
        JOIN employees e ON lb.employee_id = e.id
        JOIN leave_types lt ON lb.leave_type_id = lt.id
        LIMIT 5
      `);
      console.log('💰 Sample balances:');
      sampleBalances.forEach((bal, i) => {
        console.log(`   ${i+1}. ${bal.first_name} ${bal.last_name} - ${bal.leave_type_name}: ${bal.remaining}/${bal.credited} days (Year: ${bal.year})`);
      });
    }
    
    // 4. Check current year balances specifically
    const currentYear = new Date().getFullYear();
    const [currentYearBalances] = await connection.execute(`
      SELECT COUNT(*) as count FROM leave_balances WHERE year = ?
    `, [currentYear]);
    console.log(`\n📅 Balances for current year (${currentYear}): ${(currentYearBalances[0].count)}`);
    
    // 5. Check companies
    const [companies] = await connection.execute('SELECT COUNT(*) as count FROM companies');
    console.log(`\n🏢 Companies in database: ${(companies[0].count)}`);
    
    if (companies[0].count > 0) {
      const [sampleCompanies] = await connection.execute('SELECT id, name FROM companies LIMIT 2');
      console.log('🏢 Sample companies:');
      sampleCompanies.forEach((comp, i) => {
        console.log(`   ${i+1}. ${comp.name} (ID: ${comp.id})`);
      });
    }
    
    await connection.end();
    
    // 6. Diagnosis
    console.log('\n🔧 DIAGNOSIS:');
    if (employees[0].count === 0) {
      console.log('❌ No employees found - need to create employees first');
    } else if (leaveTypes[0].count === 0) {
      console.log('❌ No leave types found - need to create leave types first');
    } else if (balances[0].count === 0) {
      console.log('❌ No leave balances found - auto-initialization should create them');
    } else if (currentYearBalances[0].count === 0) {
      console.log('❌ No balances for current year - need to create current year balances');
    } else {
      console.log('✅ Data exists - issue might be in frontend or API');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLeaveBalances();
