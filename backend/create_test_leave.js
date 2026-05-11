// Simple test to create a leave request directly using the service
const path = require('path');

// Import the database configuration
const dbConfig = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
  database: 'hrms_db'
};

async function createTestLeaveRequest() {
  try {
    console.log('Creating test leave request...');
    
    // Simple MySQL query without external dependencies
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if we have necessary data
    const [employees] = await connection.execute('SELECT id, first_name, last_name FROM employees LIMIT 1');
    const [leaveTypes] = await connection.execute('SELECT id, name FROM leave_types LIMIT 1');
    
    if (employees.length === 0) {
      console.log('❌ No employees found in database');
      await connection.end();
      return;
    }
    
    if (leaveTypes.length === 0) {
      console.log('❌ No leave types found in database');
      await connection.end();
      return;
    }
    
    const employee = employees[0];
    const leaveType = leaveTypes[0];
    
    console.log(`✅ Found employee: ${employee.first_name} ${employee.last_name}`);
    console.log(`✅ Found leave type: ${leaveType.name}`);
    
    // Create a test leave request
    const today = new Date();
    const startDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
    const endDate = new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000); // 2 days later
    
    const [result] = await connection.execute(`
      INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at)
      VALUES (UUID(), 'test-company-id', ?, ?, ?, ?, 2, 'pending', NOW())
    `, [employee.id, leaveType.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);
    
    console.log(`✅ Created test leave request with ID: ${result.insertId}`);
    
    // Check the created request
    const [requests] = await connection.execute(`
      SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.id = LAST_INSERT_ID()
    `);
    
    if (requests.length > 0) {
      const req = requests[0];
      console.log(`✅ Leave request created:`);
      console.log(`   Employee: ${req.employee_name}`);
      console.log(`   Type: ${req.leave_type_name}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Dates: ${req.start_date} to ${req.end_date}`);
    }
    
    await connection.end();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

createTestLeaveRequest();
