// Simple script to create test data without complex SQL
const mysql = require('mysql2/promise');

async function createSimpleTestData() {
  let connection;
  try {
    console.log('🔍 Creating simple test data...');
    
    // Database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrms_db',
      port: 3306
    });
    
    // 1. Create company if not exists
    const [companies] = await connection.execute('SELECT id FROM companies LIMIT 1');
    let companyId;
    if (companies[0].length === 0) {
      companyId = require('uuid').v4();
      await connection.execute(
        'INSERT INTO companies (id, name, address, phone, email) VALUES (?, ?, ?, ?)',
        [companyId, 'Test Company', '123 Test St', 'test@company.com']
      );
      console.log('✅ Created company');
    } else {
      companyId = companies[0][0].id;
      console.log('✅ Using existing company');
    }
    
    // 2. Create employees if not exist
    const [employees] = await connection.execute('SELECT id FROM employees LIMIT 3');
    let employeeIds = [];
    
    if (employees[0].length === 0) {
      const testEmployees = [
        { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@test.com' },
        { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@test.com' },
        { firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@test.com' }
      ];
      
      for (const emp of testEmployees) {
        const employeeId = require('uuid').v4();
        await connection.execute(
          'INSERT INTO employees (id, company_id, first_name, last_name, email, hire_date, contract_type, department, status) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)',
          [employeeId, companyId, emp.firstName, emp.lastName, emp.email, 'CDI', 'IT', 'active']
        );
        
        // Create user account
        const userId = require('uuid').v4();
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await connection.execute(
          'INSERT INTO users (id, company_id, email, password_hash, role, employee_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [userId, companyId, emp.email, hashedPassword, 'employee', employeeId]
        );
        
        employeeIds.push(employeeId);
      }
      console.log('✅ Created 3 employees with user accounts');
    } else {
      employeeIds = employees[0].map(emp => emp.id);
      console.log(`✅ Using ${employees[0].length} existing employees`);
    }
    
    // 3. Create leave types if not exist
    const [leaveTypes] = await connection.execute('SELECT id FROM leave_types LIMIT 2');
    let leaveTypeIds = [];
    
    if (leaveTypes[0].length === 0) {
      const annualLeaveId = require('uuid').v4();
      const sickLeaveId = require('uuid').v4();
      
      await connection.execute(
        'INSERT INTO leave_types (id, company_id, name, annual_days, requires_approval, is_active) VALUES (?, ?, ?, 25, 1, 1)',
        [annualLeaveId, companyId, 'Congés annuels']
      );
      
      await connection.execute(
        'INSERT INTO leave_types (id, company_id, name, annual_days, requires_approval, is_active) VALUES (?, ?, ?, 10, 1, 1)',
        [sickLeaveId, companyId, 'Congé maladie']
      );
      
      leaveTypeIds = [annualLeaveId, sickLeaveId];
      console.log('✅ Created 2 leave types');
    } else {
      leaveTypeIds = leaveTypes[0].map(lt => lt.id);
      console.log(`✅ Using ${leaveTypes[0].length} existing leave types`);
    }
    
    // 4. Create leave requests
    const today = new Date();
    for (let i = 0; i < employeeIds.length; i++) {
      const employeeId = employeeIds[i];
      const leaveTypeId = leaveTypeIds[0]; // Use annual leave for all
      
      // Create 2 requests per employee
      for (let j = 0; j < 2; j++) {
        const requestId = require('uuid').v4();
        const startDate = new Date(today.getTime() + (7 + i * 3 + j * 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = new Date(today.getTime() + (9 + i * 3 + j * 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        await connection.execute(
          'INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at) VALUES (?, ?, ?, ?, ?, 2, ?, NOW())',
          [requestId, companyId, employeeId, leaveTypeId, startDate, endDate, j === 0 ? 'pending' : 'approved']
        );
      }
    }
    console.log('✅ Created leave requests');
    
    // 5. Create leave balances
    const currentYear = new Date().getFullYear();
    for (const employeeId of employeeIds) {
      for (let i = 0; i < leaveTypeIds.length; i++) {
        const balanceId = require('uuid').v4();
        const days = i === 0 ? 25 : 10; // 25 for annual, 10 for sick
        
        await connection.execute(
          'INSERT INTO leave_balances (id, employee_id, leave_type_id, year, credited, taken, remaining, last_updated) VALUES (?, ?, ?, ?, 0, ?, NOW())',
          [balanceId, employeeId, leaveTypeIds[i], currentYear, days]
        );
      }
    }
    console.log('✅ Created leave balances');
    
    // 6. Show results
    const [totalRequests] = await connection.execute('SELECT COUNT(*) as count FROM leave_requests');
    const [totalBalances] = await connection.execute('SELECT COUNT(*) as count FROM leave_balances');
    
    console.log(`📊 Total leave requests: ${totalRequests[0][0].count}`);
    console.log(`📊 Total leave balances: ${totalBalances[0][0].count}`);
    
    // Show sample data
    const [sampleData] = await connection.execute(`
      SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      ORDER BY lr.requested_at DESC
      LIMIT 5
    `);
    
    console.log('📋 Sample leave requests:');
    sampleData[0].forEach((req) => {
      console.log(`   ${req.employee_name} - ${req.leave_type_name} - ${req.status} (${req.start_date} → ${req.end_date})`);
    });
    
    console.log('✅ Test data creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createSimpleTestData();
