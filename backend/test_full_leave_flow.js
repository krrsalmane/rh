const mysql = require('mysql2/promise');

async function testFullLeaveFlow() {
  console.log('🔍 Testing full leave flow...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '',
      database: 'hrms_db'
    });
    
    // Step 1: Check if users exist
    console.log('\n👥 Step 1: Checking users...');
    const usersResult = await connection.execute('SELECT id, email, company_id FROM users LIMIT 5');
    console.log(`   Found ${usersResult[0].length} users`);
    usersResult[0].forEach(user => {
      console.log(`   - ${user.email} (Company: ${user.company_id})`);
    });
    
    // Step 2: Check leave requests
    console.log('\n📋 Step 2: Checking leave requests...');
    const leavesResult = await connection.execute(`
      SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.name as leave_type_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      ORDER BY lr.requested_at DESC LIMIT 10
    `);
    console.log(`   Found ${leavesResult[0].length} leave requests`);
    leavesResult[0].forEach(leave => {
      console.log(`   - ${leave.employee_name}: ${leave.status} (${leave.leave_type_name})`);
    });
    
    // Step 3: Test API call (simulate frontend)
    console.log('\n🌐 Step 3: Testing API call...');
    const axios = require('axios');
    
    try {
      // First login to get token
      const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
        email: 'superadmin@atlastech.ma',
        password: 'Admin@1234'
      });
      
      const token = loginResponse.data.data.accessToken;
      console.log('   ✅ Login successful');
      
      // Then test leave requests API
      const leavesResponse = await axios.get('http://localhost:3000/api/leaves?page=1&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('   ✅ API Response:', {
        total: leavesResponse.data.data?.pagination?.total,
        count: leavesResponse.data.data?.length,
        items: leavesResponse.data.data?.map?.(item => ({
          id: item.id,
          employee: item.employeeName,
          status: item.status,
          type: item.leaveTypeName
        }))
      });
      
    } catch (apiError) {
      console.error('   ❌ API Test failed:', apiError.response?.data || apiError.message);
    }
    
    await connection.end();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFullLeaveFlow();
