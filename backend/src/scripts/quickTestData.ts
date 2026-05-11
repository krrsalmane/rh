import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export async function createQuickTestData() {
  try {
    console.log('🔍 Creating quick test data...');
    
    // 1. Create company if not exists
    const companiesResult = await query('SELECT id FROM companies LIMIT 1');
    const companies = companiesResult.rows;
    let companyId: string;
    
    if (companies.length === 0) {
      companyId = uuidv4();
      await query(`
        INSERT INTO companies (id, name, address, phone, email) 
        VALUES (?, 'Test Company', '123 Test St', '555-0123', 'test@company.com')
      `, [companyId]);
      console.log('✅ Created test company');
    } else {
      companyId = companies[0].id;
      console.log('✅ Using existing company');
    }
    
    // 2. Create employees if not exists
    const employeesResult = await query('SELECT id, first_name, last_name FROM employees LIMIT 3');
    const employees = employeesResult.rows;
    let employeeIds: string[] = [];
    
    if (employees.length === 0) {
      const testEmployees = [
        { firstName: 'Jean', lastName: 'Dupont' },
        { firstName: 'Marie', lastName: 'Martin' },
        { firstName: 'Pierre', lastName: 'Bernard' }
      ];
      
      for (const emp of testEmployees) {
        const employeeId = uuidv4();
        await query(`
          INSERT INTO employees (id, company_id, first_name, last_name, email, hire_date, contract_type, department, status)
          VALUES (?, ?, ?, ?, ?, CURDATE(), 'CDI', 'IT', 'active')
        `, [employeeId, companyId, emp.firstName, emp.lastName, `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@test.com`]);
        employeeIds.push(employeeId);
      }
      console.log('✅ Created 3 test employees');
    } else {
      employeeIds = employees.rows.map((e: any) => e.id);
      console.log(`✅ Using ${employees.rows.length} existing employees`);
    }
    
    // 3. Create leave types if not exists
    const [leaveTypes] = await query('SELECT id, name, annual_days FROM leave_types LIMIT 2');
    let leaveTypeIds: string[] = [];
    
    if (leaveTypes.rows.length === 0) {
      const annualLeaveId = uuidv4();
      const sickLeaveId = uuidv4();
      
      await query(`
        INSERT INTO leave_types (id, company_id, name, annual_days, requires_approval, is_active)
        VALUES (?, ?, 'Congés annuels', 25, 1, 1)
      `, [annualLeaveId, companyId]);
      
      await query(`
        INSERT INTO leave_types (id, company_id, name, annual_days, requires_approval, is_active)
        VALUES (?, ?, 'Congé maladie', 10, 1, 1)
      `, [sickLeaveId, companyId]);
      
      leaveTypeIds = [annualLeaveId, sickLeaveId];
      console.log('✅ Created 2 leave types');
    } else {
      leaveTypeIds = leaveTypes.rows.map((lt: any) => lt.id);
      console.log(`✅ Using ${leaveTypes.rows.length} existing leave types`);
    }
    
    // 4. Create leave requests
    const today = new Date();
    const requests = [
      {
        employeeId: employeeIds[0],
        leaveTypeId: leaveTypeIds[0],
        startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      },
      {
        employeeId: employeeIds[1] || employeeIds[0],
        leaveTypeId: leaveTypeIds[0],
        startDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      },
      {
        employeeId: employeeIds[2] || employeeIds[0],
        leaveTypeId: leaveTypeIds[1] || leaveTypeIds[0],
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
      `, [requestId, companyId, req.employeeId, req.leaveTypeId, req.startDate, req.endDate, req.status]);
    }
    
    console.log('✅ Created 3 leave requests');
    
    // 5. Create leave balances
    const currentYear = new Date().getFullYear();
    for (const employeeId of employeeIds) {
      for (const leaveTypeId of leaveTypeIds) {
        const balanceId = uuidv4();
        const days = leaveTypeId === leaveTypeIds[0] ? 25 : 10; // 25 for annual, 10 for sick
        await query(`
          INSERT INTO leave_balances (id, employee_id, leave_type_id, year, credited, taken, remaining, last_updated)
          VALUES (?, ?, ?, ?, ?, 0, ?, NOW())
        `, [balanceId, employeeId, leaveTypeId, currentYear, days, days]);
      }
    }
    
    console.log('✅ Created leave balances');
    
    // 6. Show results
    const [totalRequests] = await query('SELECT COUNT(*) as count FROM leave_requests');
    const [totalBalances] = await query('SELECT COUNT(*) as count FROM leave_balances');
    
    console.log(`📊 Total leave requests: ${totalRequests.rows[0].count}`);
    console.log(`📊 Total leave balances: ${totalBalances.rows[0].count}`);
    
    return {
      success: true,
      requests: totalRequests.rows[0].count,
      balances: totalBalances.rows[0].count
    };
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    return { success: false, error: (error as Error).message };
  }
}
