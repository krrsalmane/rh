// Simple script to create real leave requests
const mysql = require('mysql2/promise');

async function createLeaveRequests() {
  let connection;
  try {
    console.log('🔍 Creating real leave requests...');
    
    // Database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrms_db',
      port: 3306
    });
    
    // Check if we have employees
    const [employees] = await connection.execute('SELECT id, first_name, last_name, company_id FROM employees LIMIT 3');
    console.log(`Found ${employees.length} employees`);
    
    if (employees.length === 0) {
      console.log('❌ No employees found. Creating test employees first...');
      
      // Create a company first
      await connection.execute(`
        INSERT INTO companies (id, name, address, phone, email) 
        VALUES (UUID(), 'Test Company', '123 Test St', '555-0123', 'test@company.com')
      `);
      
      const [company] = await connection.execute('SELECT id FROM companies ORDER BY created_at DESC LIMIT 1');
      const companyId = company[0].id;
      
      // Create employees
      const testEmployees = [
        ['Jean', 'Dupont', 'jean.dupont@test.com'],
        ['Marie', 'Martin', 'marie.martin@test.com'],
        ['Pierre', 'Bernard', 'pierre.bernard@test.com']
      ];
      
      for (const [firstName, lastName, email] of testEmployees) {
        const employeeId = require('uuid').v4();
        await connection.execute(`
          INSERT INTO employees (id, company_id, first_name, last_name, email, hire_date, contract_type, department, status)
          VALUES (?, ?, ?, ?, ?, CURDATE(), 'CDI', 'IT', 'active')
        `, [employeeId, companyId, firstName, lastName, email]);
      }
      
      // Get the created employees
      const [newEmployees] = await connection.execute('SELECT id, first_name, last_name, company_id FROM employees LIMIT 3');
      employees.push(...newEmployees);
    }
    
    // Check if we have leave types
    const [leaveTypes] = await connection.execute('SELECT id, name, annual_days, company_id FROM leave_types LIMIT 2');
    console.log(`Found ${leaveTypes.length} leave types`);
    
    if (leaveTypes.length === 0) {
      console.log('❌ No leave types found. Creating test leave types...');
      
      const [company] = await connection.execute('SELECT id FROM companies ORDER BY created_at DESC LIMIT 1');
      const companyId = company[0].id;
      
      // Create leave types
      await connection.execute(`
        INSERT INTO leave_types (id, company_id, name, annual_days, requires_approval, is_active)
        VALUES (UUID(), ?, 'Congés annuels', 25, 1, 1)
      `, [companyId]);
      
      await connection.execute(`
        INSERT INTO leave_types (id, company_id, name, annual_days, requires_approval, is_active)
        VALUES (UUID(), ?, 'Congé maladie', 10, 1, 1)
      `, [companyId]);
      
      // Get the created leave types
      const [newLeaveTypes] = await connection.execute('SELECT id, name, annual_days, company_id FROM leave_types LIMIT 2');
      leaveTypes.push(...newLeaveTypes);
    }
    
    // Create leave requests
    const today = new Date();
    const requests = [
      {
        employeeId: employees[0].id,
        companyId: employees[0].company_id,
        leaveTypeId: leaveTypes[0].id,
        startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      },
      {
        employeeId: employees[1]?.id || employees[0].id,
        companyId: employees[1]?.company_id || employees[0].company_id,
        leaveTypeId: leaveTypes[0].id,
        startDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      },
      {
        employeeId: employees[2]?.id || employees[0].id,
        companyId: employees[2]?.company_id || employees[0].company_id,
        leaveTypeId: leaveTypes[1]?.id || leaveTypes[0].id,
        startDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      }
    ];
    
    for (const req of requests) {
      const requestId = require('uuid').v4();
      await connection.execute(`
        INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at)
        VALUES (?, ?, ?, ?, ?, ?, 2, ?, NOW())
      `, [requestId, req.companyId, req.employeeId, req.leaveTypeId, req.startDate, req.endDate, req.status]);
      
      console.log(`✅ Created leave request: ${req.employeeId} - ${req.status}`);
    }
    
    // Check total leave requests
    const [totalRequests] = await connection.execute('SELECT COUNT(*) as count FROM leave_requests');
    console.log(`📊 Total leave requests in database: ${totalRequests[0].count}`);
    
    // Show sample requests with employee names
    const [sampleRequests] = await connection.execute(`
      SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      ORDER BY lr.requested_at DESC
      LIMIT 5
    `);
    
    console.log('📋 Sample leave requests:');
    sampleRequests.forEach((req) => {
      console.log(`   ${req.employee_name} - ${req.leave_type_name} - ${req.status} (${req.start_date} → ${req.end_date})`);
    });
    
    console.log('✅ Real leave requests created successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create leave requests:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createLeaveRequests();
