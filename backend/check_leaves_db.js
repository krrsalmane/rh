// Check database directly for leave requests
const mysql = require('mysql2/promise');

async function checkLeaveRequests() {
  try {
    console.log('Checking database for leave requests...');
    
    // Database connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrms_db',
      port: 3306
    });
    
    // Check if leave_requests table exists and has data
    const [tables] = await connection.execute("SHOW TABLES LIKE 'leave_requests'");
    console.log('Leave requests table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Count total leave requests
      const [count] = await connection.execute('SELECT COUNT(*) as count FROM leave_requests');
      console.log('Total leave requests:', count[0].count);
      
      // Get sample leave requests
      const [requests] = await connection.execute('SELECT * FROM leave_requests LIMIT 5');
      console.log('Sample leave requests:');
      requests.forEach((req, i) => {
        console.log(`${i + 1}. ID: ${req.id}, Employee: ${req.employee_id}, Status: ${req.status}, Dates: ${req.start_date} to ${req.end_date}`);
      });
      
      // Check different statuses
      const [statusCounts] = await connection.execute('SELECT status, COUNT(*) as count FROM leave_requests GROUP BY status');
      console.log('Leave requests by status:');
      statusCounts.forEach(row => {
        console.log(`  ${row.status}: ${row.count}`);
      });
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('Database check failed:', error.message);
  }
}

checkLeaveRequests();
