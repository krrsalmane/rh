// Quick fix for employee leave requests - create test data manually
const mysql = require('mysql2/promise');

async function quickFix() {
  let connection;
  try {
    console.log('🔧 Quick fix: Creating test data...');
    
    // Try different connection settings
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'hrms_db',
      port: 3306,
      acquireTimeout: 60000,
      timeout: 60000
    });
    
    console.log('✅ Database connected');
    
    // Check existing data
    const [companies] = await connection.execute('SELECT id FROM companies LIMIT 1');
    const [employees] = await connection.execute('SELECT id, first_name, last_name, email FROM employees LIMIT 3');
    const [leaveTypes] = await connection.execute('SELECT id, name FROM leave_types LIMIT 2');
    const [leaveRequests] = await connection.execute('SELECT COUNT(*) as count FROM leave_requests');
    
    console.log(`📊 Companies: ${companies[0].length}`);
    console.log(`📊 Employees: ${employees[0].length}`);
    console.log(`📊 Leave types: ${leaveTypes[0].length}`);
    console.log(`📊 Leave requests: ${leaveRequests[0][0].count}`);
    
    // If no data, create minimal test data
    if (employees[0].length === 0) {
      console.log('🔧 Creating minimal test data...');
      
      // Create company
      const companyId = 'test-company-123';
      await connection.execute(
        'INSERT INTO companies (id, name, address, phone, email) VALUES (?, ?, ?, ?)',
        [companyId, 'Test Company', '123 Test St', 'test@company.com']
      );
      
      // Create employee
      const employeeId = 'test-employee-123';
      await connection.execute(
        'INSERT INTO employees (id, company_id, first_name, last_name, email, hire_date, contract_type, department, status) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)',
        [employeeId, companyId, 'Jean', 'Dupont', 'jean.dupont@test.com', 'CDI', 'IT', 'active']
      );
      
      // Create user
      const userId = 'test-user-123';
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await connection.execute(
        'INSERT INTO users (id, company_id, email, password_hash, role, employee_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [userId, companyId, 'jean.dupont@test.com', hashedPassword, 'employee', employeeId]
      );
      
      // Create leave type
      const leaveTypeId = 'test-leave-type-123';
      await connection.execute(
        'INSERT INTO leave_types (id, company_id, name, annual_days, requires_approval, is_active) VALUES (?, ?, ?, ?, 1, 1)',
        [leaveTypeId, companyId, 'Congés annuels', 25]
      );
      
      // Create leave request
      const requestId = 'test-request-123';
      const today = new Date();
      const startDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await connection.execute(
        'INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at) VALUES (?, ?, ?, ?, ?, ?, 2, ?, NOW())',
        [requestId, companyId, employeeId, leaveTypeId, startDate, endDate, 'pending']
      );
      
      // Create leave balance
      const balanceId = 'test-balance-123';
      const currentYear = new Date().getFullYear();
      
      await connection.execute(
        'INSERT INTO leave_balances (id, employee_id, leave_type_id, year, credited, taken, remaining, last_updated) VALUES (?, ?, ?, ?, 0, ?, NOW())',
        [balanceId, employeeId, leaveTypeId, currentYear, 25]
      );
      
      console.log('✅ Test data created successfully!');
      console.log('👤 Employee: jean.dupont@test.com / password123');
      
      // Show created data
      const [checkRequests] = await connection.execute(`
        SELECT lr.*, e.first_name, e.last_name, lt.name as leave_type_name
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.employee_id = ?
      `, [employeeId]);
      
      console.log('📋 Created leave requests:');
      checkRequests[0].forEach((req) => {
        console.log(`   ${req.first_name} ${req.last_name} - ${req.leave_type_name} - ${req.status} (${req.start_date} → ${req.end_date})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

quickFix();
