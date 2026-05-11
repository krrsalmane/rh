const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: 'superadmin@atlastech.ma',
  password: 'Admin@1234'
};

async function testNotificationsAPI() {
  console.log('🧪 Testing Notifications API...');
  
  let authToken = '';
  
  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, TEST_USER);
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Test get notifications
    console.log('📬 Getting notifications...');
    const notificationsResponse = await axios.get(`${BACKEND_URL}/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Get notifications:', notificationsResponse.data);
    
    // Step 3: Test get unread count
    console.log('🔢 Getting unread count...');
    const unreadResponse = await axios.get(`${BACKEND_URL}/api/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Unread count:', unreadResponse.data);
    
    // Step 4: Create a test notification in database
    console.log('📝 Creating test notification...');
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '',
      database: 'hrms_db'
    });

    // Get user info
    const [userRows] = await connection.execute(
      'SELECT id, company_id FROM users WHERE email = ?',
      [TEST_USER.email]
    );

    if (userRows.length > 0) {
      const user = userRows[0];
      const { v4: uuidv4 } = require('uuid');
      
      await connection.execute(
        `INSERT INTO notifications (id, user_id, company_id, type, title, message, data, created_at, read) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), FALSE)`,
        [
          uuidv4(),
          user.id,
          user.company_id,
          'test_notification',
          'Test Notification',
          'This is a test notification from API testing',
          JSON.stringify({ test: true, timestamp: new Date().toISOString() })
        ]
      );
      
      console.log('✅ Test notification created');
      
      // Step 5: Test get notifications again to see the new notification
      console.log('📬 Getting notifications after creation...');
      const newNotificationsResponse = await axios.get(`${BACKEND_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Updated notifications:', newNotificationsResponse.data);
      
      // Step 6: Test marking notification as read
      if (newNotificationsResponse.data.data && newNotificationsResponse.data.data.length > 0) {
        const notificationId = newNotificationsResponse.data.data[0].id;
        console.log('📖 Marking notification as read...');
        
        await axios.post(`${BACKEND_URL}/api/notifications/read`, 
          { notificationId },
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
        console.log('✅ Notification marked as read');
      }
      
      await connection.end();
    }
    
    console.log('\n🎉 All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BACKEND_URL}/api/auth/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the server with: npm run dev');
    return;
  }
  
  console.log('✅ Server is running');
  await testNotificationsAPI();
}

main();
