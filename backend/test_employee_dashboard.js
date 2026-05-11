// Test employee dashboard API
const axios = require('axios');

async function testEmployeeDashboard() {
  try {
    console.log('Testing employee dashboard API...');
    
    // First login as employee to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'employee@example.com',
      password: 'password123'
    }).catch(err => {
      console.log('Login failed, trying with test credentials...');
      return null;
    });
    
    if (loginResponse) {
      const token = loginResponse.data.data.token;
      
      // Test dashboard with auth
      const dashboardResponse = await axios.get('http://localhost:3000/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Employee Dashboard Response:', JSON.stringify(dashboardResponse.data, null, 2));
      console.log('Pending leaves:', dashboardResponse.data.data.stats?.pendingLeaves);
    } else {
      console.log('Could not authenticate - dashboard requires authentication');
    }
    
  } catch (error) {
    console.error('Employee dashboard test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testEmployeeDashboard();
