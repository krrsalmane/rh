// Simple test to verify dashboard API is working
const axios = require('axios');

async function testDashboard() {
  try {
    console.log('Testing dashboard API...');
    
    // Test without auth first to see if route exists
    const response = await axios.get('http://localhost:3000/api/dashboard', {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.log('Expected auth error:', err.response?.status || err.message);
      return { status: err.response?.status || 500 };
    });
    
    console.log('Dashboard API response:', response.status);
    
  } catch (error) {
    console.error('Dashboard test failed:', error.message);
  }
}

testDashboard();
