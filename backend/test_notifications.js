const io = require('socket.io-client');
const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:3000';
const WEBSOCKET_URL = 'http://localhost:3000';

// Test credentials (use your actual test user)
const TEST_USER = {
  email: 'superadmin@atlastech.ma',
  password: 'Admin@1234'
};

let authToken = '';
let socket = null;

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

function connectWebSocket() {
  console.log('🔌 Connecting to WebSocket...');
  
  socket = io(WEBSOCKET_URL, {
    auth: {
      token: authToken
    }
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket connected');
  });

  socket.on('authenticated', (data) => {
    console.log('🔓 WebSocket authenticated:', data);
  });

  socket.on('notification', (notification) => {
    console.log('📬 Received notification:', notification);
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ WebSocket connection error:', error.message);
  });

  return socket;
}

async function testNotificationAPI() {
  console.log('🧪 Testing Notification API...');
  
  try {
    // Test getting notifications
    const notificationsResponse = await axios.get(`${BACKEND_URL}/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Get notifications successful:', notificationsResponse.data);

    // Test getting unread count
    const unreadResponse = await axios.get(`${BACKEND_URL}/api/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Get unread count successful:', unreadResponse.data);

    return true;
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDirectNotification() {
  console.log('📤 Testing direct notification creation...');
  
  try {
    // Create a test notification directly in the database
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '',
      database: 'hrms_db'
    });

    // Get user ID for test user
    const [userRows] = await connection.execute(
      'SELECT id, company_id FROM users WHERE email = ?',
      [TEST_USER.email]
    );

    if (userRows.length === 0) {
      console.error('❌ Test user not found');
      return false;
    }

    const user = userRows[0];
    const notificationId = require('uuid').v4();

    // Insert test notification
    await connection.execute(
      `INSERT INTO notifications (id, user_id, company_id, type, title, message, data, created_at, read) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), FALSE)`,
      [
        notificationId,
        user.id,
        user.company_id,
        'test_notification',
        'Test Notification',
        'This is a test notification from the testing script',
        JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      ]
    );

    await connection.end();
    console.log('✅ Test notification created in database');
    return true;
  } catch (error) {
    console.error('❌ Direct notification test failed:', error.message);
    return false;
  }
}

async function testWebSocketNotification() {
  console.log('📡 Testing WebSocket notification delivery...');
  
  return new Promise((resolve) => {
    let notificationReceived = false;
    
    // Listen for notification
    const notificationHandler = (notification) => {
      if (notification.type === 'test_notification') {
        console.log('✅ WebSocket notification received:', notification);
        notificationReceived = true;
        socket.off('notification', notificationHandler);
        resolve(true);
      }
    };

    socket.on('notification', notificationHandler);

    // Create notification after a short delay
    setTimeout(async () => {
      const success = await testDirectNotification();
      if (!success) {
        socket.off('notification', notificationHandler);
        resolve(false);
      }
    }, 1000);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!notificationReceived) {
        console.log('❌ WebSocket notification not received within timeout');
        socket.off('notification', notificationHandler);
        resolve(false);
      }
    }, 10000);
  });
}

async function runAllTests() {
  console.log('🚀 Starting Notification System Tests\n');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without login');
    return;
  }

  // Step 2: Connect WebSocket
  connectWebSocket();

  // Wait for WebSocket connection
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Test API endpoints
  const apiSuccess = await testNotificationAPI();

  // Step 4: Test direct notification creation
  const directSuccess = await testDirectNotification();

  // Step 5: Test WebSocket notification delivery
  const websocketSuccess = await testWebSocketNotification();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Login: ${loginSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ API Endpoints: ${apiSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Direct Notification: ${directSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ WebSocket Delivery: ${websocketSuccess ? 'PASSED' : 'FAILED'}`);

  // Cleanup
  if (socket) {
    socket.disconnect();
  }

  console.log('\n🎉 Testing completed!');
}

// Install required packages if not present
try {
  require('socket.io-client');
  require('axios');
  require('uuid');
} catch (error) {
  console.log('📦 Installing required packages...');
  const { execSync } = require('child_process');
  execSync('npm install socket.io-client axios uuid', { stdio: 'inherit' });
}

// Run tests
runAllTests().catch(console.error);
