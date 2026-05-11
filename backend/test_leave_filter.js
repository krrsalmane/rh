const mysql = require('mysql2/promise');

async function testLeaveFilter() {
  console.log('🧪 Testing leave filter...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '',
      database: 'hrms_db'
    });
    
    // Test 1: Get all leave requests
    console.log('\n📋 Test 1: All leave requests');
    const allResults = await connection.execute(
      `SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.company_id = ? 
       ORDER BY lr.requested_at DESC LIMIT 10`,
      ['COMPANY_ID_HERE']
    );
    console.log(`   Found ${allResults[0].length} requests`);
    
    // Test 2: Filter by status = 'pending'
    console.log('\n📋 Test 2: Filter by status = pending');
    const pendingResults = await connection.execute(
      `SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.company_id = ? AND lr.status = ?
       ORDER BY lr.requested_at DESC LIMIT 10`,
      ['COMPANY_ID_HERE', 'pending']
    );
    console.log(`   Found ${pendingResults[0].length} pending requests`);
    
    // Test 3: Get company ID from users
    console.log('\n📋 Test 3: Get actual company ID');
    const companyResults = await connection.execute(
      'SELECT DISTINCT company_id FROM users WHERE email = ? LIMIT 1',
      ['superadmin@atlastech.ma']
    );
    
    if (companyResults[0].length > 0) {
      const companyId = companyResults[0][0].company_id;
      console.log(`   Company ID: ${companyId}`);
      
      // Test 4: Filter with real company ID
      console.log('\n📋 Test 4: Filter with real company ID');
      const realResults = await connection.execute(
        `SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id
         JOIN leave_types lt ON lr.leave_type_id = lt.id
         WHERE lr.company_id = ? AND lr.status = ?
         ORDER BY lr.requested_at DESC LIMIT 10`,
        [companyId, 'pending']
      );
      console.log(`   Found ${realResults[0].length} pending requests for company`);
      
      // Show sample data
      if (realResults[0].length > 0) {
        console.log('   Sample request:', realResults[0][0]);
      }
    }
    
    await connection.end();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLeaveFilter();
