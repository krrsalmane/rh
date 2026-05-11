import { Request, Response } from 'express';
import { query } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

export async function createTestData(req: Request, res: Response) {
  try {
    console.log('🔍 Creating test data for leave requests...');
    
    // 1. Create company if needed
    const companiesResult = await query('SELECT id FROM companies LIMIT 1');
    const companies = companiesResult.rows as any[];
    
    let companyId: string;
    if (companies.length === 0) {
      companyId = uuidv4();
      await query(`
        INSERT INTO companies (id, name, address, phone, email) 
        VALUES (?, 'Test Company', '123 Test St', '555-0123', 'test@company.com')
      `, [companyId]);
    } else {
      companyId = companies[0].id;
    }
    
    // 2. Create employees if needed
    const employeesResult = await query('SELECT id FROM employees LIMIT 3');
    const employees = employeesResult.rows as any[];
    
    let employeeIds: string[] = [];
    if (employees.length === 0) {
      const testEmployees = [
        { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@test.com' },
        { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@test.com' },
        { firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@test.com' }
      ];
      
      for (const emp of testEmployees) {
        const employeeId = uuidv4();
        await query(`
          INSERT INTO employees (id, company_id, first_name, last_name, email, hire_date, contract_type, department, status)
          VALUES (?, ?, ?, ?, ?, CURDATE(), 'CDI', 'IT', 'active')
        `, [employeeId, companyId, emp.firstName, emp.lastName, emp.email]);
        
        // Also create a user account for each employee
        const userId = uuidv4();
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await query(`
          INSERT INTO users (id, company_id, email, password_hash, role, employee_id, is_active)
          VALUES (?, ?, ?, ?, 'employee', ?, 1)
        `, [userId, companyId, emp.email, hashedPassword, employeeId]);
        
        employeeIds.push(employeeId);
      }
    } else {
      employeeIds = employees.map((e: any) => e.id);
    }
    
    // 3. Create leave types if needed
    const leaveTypesResult = await query('SELECT id, name FROM leave_types LIMIT 2');
    const leaveTypes = leaveTypesResult.rows as any[];
    
    let leaveTypeIds: string[] = [];
    if (leaveTypes.length === 0) {
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
    } else {
      leaveTypeIds = leaveTypes.map((lt: any) => lt.id);
    }
    
    // 4. Create leave requests - one for each employee
    const today = new Date();
    const requests = [];
    
    // Create multiple requests for each employee so they have their own data
    for (let i = 0; i < employeeIds.length; i++) {
      const employeeId = employeeIds[i];
      
      // Create 2-3 requests per employee with different statuses
      requests.push({
        employeeId: employeeId,
        leaveTypeId: leaveTypeIds[0],
        startDate: new Date(today.getTime() + (7 + i * 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + (9 + i * 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      });
      
      requests.push({
        employeeId: employeeId,
        leaveTypeId: leaveTypeIds[0],
        startDate: new Date(today.getTime() + (14 + i * 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + (16 + i * 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: i === 0 ? 'approved' : 'pending' // First employee has one approved
      });
      
      if (i === 1) {
        // Second employee has one rejected
        requests.push({
          employeeId: employeeId,
          leaveTypeId: leaveTypeIds[1],
          startDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'rejected'
        });
      }
    }
    
    for (const req of requests) {
      const requestId = uuidv4();
      await query(`
        INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at)
        VALUES (?, ?, ?, ?, ?, ?, 2, ?, NOW())
      `, [requestId, companyId, req.employeeId, req.leaveTypeId, req.startDate, req.endDate, req.status]);
    }
    
    // 5. Create leave balances
    const currentYear = new Date().getFullYear();
    for (const employeeId of employeeIds) {
      for (let i = 0; i < leaveTypeIds.length; i++) {
        const balanceId = uuidv4();
        const days = i === 0 ? 25 : 10; // 25 for annual, 10 for sick
        await query(`
          INSERT INTO leave_balances (id, employee_id, leave_type_id, year, credited, taken, remaining, last_updated)
          VALUES (?, ?, ?, ?, ?, 0, ?, NOW())
        `, [balanceId, employeeId, leaveTypeIds[i], currentYear, days, days]);
      }
    }
    
    // 6. Get results
    const totalRequestsResult = await query('SELECT COUNT(*) as count FROM leave_requests');
    const totalBalancesResult = await query('SELECT COUNT(*) as count FROM leave_balances');
    
    res.json({
      success: true,
      message: 'Test data created successfully',
      data: {
        requests: (totalRequestsResult.rows[0] as any).count,
        balances: (totalBalancesResult.rows[0] as any).count,
        employees: employeeIds.length,
        leaveTypes: leaveTypeIds.length
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test data',
      error: (error as Error).message
    });
  }
}
