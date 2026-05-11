import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

async function createTestLeaveRequest() {
  try {
    console.log('🔍 Creating test leave request...');
    
    // Check if we have employees and leave types
    const employeesResult = await query('SELECT id, first_name, last_name FROM employees LIMIT 1');
    const leaveTypesResult = await query('SELECT id, name FROM leave_types LIMIT 1');
    const employees = employeesResult.rows;
    const leaveTypes = leaveTypesResult.rows;
    
    if (employees.length === 0) {
      console.log('❌ No employees found in database');
      return;
    }
    
    if (leaveTypes.length === 0) {
      console.log('❌ No leave types found in database');
      return;
    }
    
    const employee = employees[0] as any;
    const leaveType = leaveTypes[0] as any;
    
    console.log(`✅ Found employee: ${employee.first_name} ${employee.last_name}`);
    console.log(`✅ Found leave type: ${leaveType.name}`);
    
    // Create a test leave request
    const today = new Date();
    const startDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
    const endDate = new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000); // 2 days later
    
    const requestId = uuidv4();
    
    await query(`
      INSERT INTO leave_requests (id, company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, requested_at)
      VALUES (?, ?, ?, ?, ?, ?, 2, 'pending', NOW())
    `, [requestId, employee.company_id || 'test-company-id', employee.id, leaveType.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);
    
    console.log(`✅ Created test leave request with ID: ${requestId}`);
    
    // Check the created request
    const requestsResult = await query(`
      SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.id = ?
    `, [requestId]);
    const requests = requestsResult.rows;
    
    if (requests.length > 0) {
      const req = requests[0] as any;
      console.log(`✅ Leave request created:`);
      console.log(`   Employee: ${req.employee_name}`);
      console.log(`   Type: ${req.leave_type_name}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Dates: ${req.start_date} to ${req.end_date}`);
    }
    
    // Check total leave requests
    const totalRequestsResult = await query('SELECT COUNT(*) as count FROM leave_requests');
    console.log(`📊 Total leave requests in database: ${(totalRequestsResult.rows[0] as any).count}`);
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the function
createTestLeaveRequest().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
