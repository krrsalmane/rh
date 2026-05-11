// Create real users in database for login testing
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createRealUsers() {
  let connection;
  try {
    console.log('🔧 Creating real users in database...');
    
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
      companyId = uuidv4();
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
    const testEmployees = [
      { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@test.com' },
      { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@test.com' },
      { firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@test.com' }
    ];
    
    for (const emp of testEmployees) {
      const [existingEmp] = await connection.execute(
        'SELECT id FROM employees WHERE email = ? LIMIT 1',
        [emp.email]
      );
      
      if (existingEmp[0].length === 0) {
        const employeeId = uuidv4();
        await connection.execute(
          'INSERT INTO employees (id, company_id, first_name, last_name, email, hire_date, contract_type, department, status) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)',
          [employeeId, companyId, emp.firstName, emp.lastName, emp.email, 'CDI', 'IT', 'active']
        );
        
        // Create user account
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await connection.execute(
          'INSERT INTO users (id, company_id, email, password_hash, role, employee_id, is_active) VALUES (?, ?, ?, ?, 'employee', ?, 1)',
          [userId, companyId, emp.email, hashedPassword, employeeId]
        );
        
        console.log(`✅ Created user: ${emp.email}`);
      } else {
        console.log(`ℹ️ User already exists: ${emp.email}`);
      }
    }
    
    // 3. Create leave types if not exist
    const [leaveTypes] = await connection.execute('SELECT id FROM leave_types LIMIT 2');
    let leaveTypeIds = [];
    
    if (leaveTypes[0].length === 0) {
      const annualLeaveId = uuidv4();
      const sickLeaveId = uuidv4();
      
      await connection.execute(
        'INSERT INTO leave_types (id, company_id, name, annual_days, requires_approval, is_active) VALUES (?, ?, ?, 25, 1, 1)',
        [annualLeaveId, companyId, 'Congés annuels']
      );
      
      await connection.execute(
        'INSERT INTO leave_types (id, company_id, name, annual_days, requires_approval, is_active) VALUES (?, ?, ?, 10, 1, 1)',
        [sickLeaveId, companyId, 'Congé maladie']
      );
      
      leaveTypeIds = [annualLeaveId, sickLeaveId];
      console.log('✅ Created leave types');
    } else {
      leaveTypeIds = leaveTypes[0].map(lt => lt.id);
      console.log('✅ Using existing leave types');
    }
    
    // 4. Create leave requests for each employee
    const [employees] = await connection.execute(
      'SELECT id, email FROM employees WHERE email IN (?, ?, ?)',
      ['jean.dupont@test.com', 'marie.martin@test.com', 'pierre.bernard@test.com']
    );
    
    const today = new Date();
    for (const emp of employees[0]) {
      // Give Jean 2 requests
      if (emp.email === 'jean.dupont@test.com') {
        // Pending request
        const req1Id = uuidv4();
        const startDate1 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate1 = new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        await connection.execute(
          'INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at) VALUES (?, ?, ?, ?, ?, ?, 2, ?, NOW())',
          [req1Id, companyId, emp.id, leaveTypeIds[0], startDate1, endDate1, 'pending']
        );
        
        // Approved request
        const req2Id = uuidv4();
        const startDate2 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate2 = new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        await connection.execute(
          'INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at) VALUES (?, ?, ?, ?, ?, ?, 2, ?, NOW())',
          [req2Id, companyId, emp.id, leaveTypeIds[0], startDate2, endDate2, 'approved']
        );
        
        console.log(`✅ Created 2 requests for ${emp.email}`);
      }
      
      // Give Marie 1 request
      else if (emp.email === 'marie.martin@test.com') {
        const reqId = uuidv4();
        const startDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        await connection.execute(
          'INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at) VALUES (?, ?, ?, ?, ?, ?, 2, ?, NOW())',
          [reqId, companyId, emp.id, leaveTypeIds[0], startDate, endDate, 'pending']
        );
        
        console.log(`✅ Created 1 request for ${emp.email}`);
      }
      
      // Pierre gets 0 requests (no data to show empty state works)
    }
    
    // 5. Create leave balances
    const currentYear = new Date().getFullYear();
    for (const emp of employees[0]) {
      for (let i = 0; i < leaveTypeIds.length; i++) {
        const [existingBalance] = await connection.execute(
          'SELECT id FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ? LIMIT 1',
          [emp.id, leaveTypeIds[i], currentYear]
        );
        
        if (existingBalance[0].length === 0) {
          const balanceId = uuidv4();
          const days = i === 0 ? 25 : 10; // 25 for annual, 10 for sick
          
          await connection.execute(
            'INSERT INTO leave_balances (id, employee_id, leave_type_id, year, credited, taken, remaining, last_updated) VALUES (?, ?, ?, ?, 0, ?, NOW())',
            [balanceId, emp.id, leaveTypeIds[i], currentYear, days]
          );
        }
      }
    }
    
    // 6. Verify results
    const [totalRequests] = await connection.execute('SELECT COUNT(*) as count FROM leave_requests');
    const [totalUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    console.log(`📊 Created ${totalRequests[0][0].count} leave requests`);
    console.log(`👥 Created ${totalUsers[0][0].count} users`);
    console.log('✅ Real users created successfully!');
    
    console.log('\n🔐 Login Credentials:');
    console.log('jean.dupont@test.com / password123');
    console.log('marie.martin@test.com / password123');
    console.log('pierre.bernard@test.com / password123');
    
  } catch (error) {
    console.error('❌ Failed to create real users:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createRealUsers();
