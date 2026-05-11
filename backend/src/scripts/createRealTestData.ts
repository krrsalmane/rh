import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

async function createRealLeaveRequests() {
  try {
    console.log('🔍 Creating real leave requests in database...');
    
    // Check existing employees and leave types
    const employeesResult = await query('SELECT id, first_name, last_name, company_id FROM employees LIMIT 3');
    const leaveTypesResult = await query('SELECT id, name FROM leave_types LIMIT 2');
    const employees = employeesResult.rows;
    const leaveTypes = leaveTypesResult.rows;
    
    if (employees.length === 0) {
      console.log('❌ No employees found. Creating test employees first...');
      await createTestEmployees();
      const newEmployeesResult = await query('SELECT id, first_name, last_name, company_id FROM employees LIMIT 3');
      employees.push(...newEmployeesResult.rows);
    }
    
    if (leaveTypes.length === 0) {
      console.log('❌ No leave types found. Creating test leave types...');
      await createTestLeaveTypes();
      const newLeaveTypesResult = await query('SELECT id, name FROM leave_types LIMIT 2');
      leaveTypes.push(...newLeaveTypesResult.rows);
    }
    
    if (employees.length === 0 || leaveTypes.length === 0) {
      console.log('❌ Still no employees or leave types. Cannot create leave requests.');
      return;
    }
    
    // Create real leave requests
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
      const requestId = uuidv4();
      await query(`
        INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at)
        VALUES (?, ?, ?, ?, ?, ?, 2, ?, NOW())
      `, [requestId, req.companyId, req.employeeId, req.leaveTypeId, req.startDate, req.endDate, req.status]);
      
      console.log(`✅ Created leave request: ${req.employeeId} - ${req.status}`);
    }
    
    // Check total leave requests
    const totalRequestsResult = await query('SELECT COUNT(*) as count FROM leave_requests');
    console.log(`📊 Total leave requests in database: ${(totalRequestsResult.rows[0] as any).count}`);
    
    // Show sample requests with employee names
    const sampleRequestsResult = await query(`
      SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      ORDER BY lr.requested_at DESC
      LIMIT 5
    `);
    
    console.log('📋 Sample leave requests:');
    sampleRequestsResult.rows.forEach((req: any) => {
      console.log(`   ${req.employee_name} - ${req.leave_type_name} - ${req.status} (${req.start_date} → ${req.end_date})`);
    });
    
    console.log('✅ Real test data created successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
  }
}

async function createTestEmployees() {
  await query(`
    INSERT INTO companies (id, name, address, phone, email) 
    VALUES (UUID(), 'Test Company', '123 Test St', '555-0123', 'test@company.com')
  `);
  
  const companyResult = await query('SELECT id FROM companies ORDER BY created_at DESC LIMIT 1');
  const companyId = (companyResult.rows[0] as any).id;
  
  const employees = [
    { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@test.com' },
    { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@test.com' },
    { firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@test.com' }
  ];
  
  for (const emp of employees) {
    const employeeId = uuidv4();
    await query(`
      INSERT INTO employees (id, company_id, first_name, last_name, email, hire_date, contract_type, department, status)
      VALUES (?, ?, ?, ?, ?, CURDATE(), 'CDI', 'IT', 'active')
    `, [employeeId, companyId, emp.firstName, emp.lastName, emp.email]);
  }
}

async function createTestLeaveTypes() {
  const companyResult = await query('SELECT id FROM companies ORDER BY created_at DESC LIMIT 1');
  const companyId = (companyResult.rows[0] as any).id;
  
  const leaveTypes = [
    { name: 'Congés annuels', daysPerYear: 25 },
    { name: 'Congé maladie', daysPerYear: 10 }
  ];
  
  for (const lt of leaveTypes) {
    await query(`
      INSERT INTO leave_types (id, company_id, name, days_per_year, requires_approval)
      VALUES (?, ?, ?, ?, 1)
    `, [uuidv4(), companyId, lt.name, lt.daysPerYear]);
  }
}

// Run the function
createRealLeaveRequests().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
