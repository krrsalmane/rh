// Test leaves API to see what's being returned
const axios = require('axios');

async function testLeavesAPI() {
  try {
    console.log('Testing leaves API...');
    
    // First login to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'employee@example.com',
      password: 'password123'
    }).catch(err => {
      console.log('Login failed, trying with test credentials...');
      return null;
    });
    
    if (loginResponse) {
      const token = loginResponse.data.data.token;
      
      // Test leaves endpoint with auth
      const leavesResponse = await axios.get('http://localhost:3000/api/leaves', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: 1,
          limit: 10
        }
      });
      
      console.log('Leaves API Response:', JSON.stringify(leavesResponse.data, null, 2));
      console.log('Number of leaves:', leavesResponse.data.data?.length || 0);
    } else {
      console.log('Could not authenticate - leaves API requires authentication');
    }
    
  } catch (error) {
    console.error('Leaves API test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testLeavesAPI();
