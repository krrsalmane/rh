// Simple test to check if test data was created
const http = require('http');

async function testTestData() {
  try {
    console.log('🔍 Testing test data creation...');
    
    // 1. Test the API endpoint
    const postData = JSON.stringify({});
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/test/create-test-data',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 API Response:', res.statusCode);
        console.log('📊 Response Body:', data);
        
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('✅ Test data created successfully!');
            console.log('📊 Created:', response.data);
          } else {
            console.log('❌ Failed to create test data:', response.message);
          }
        } catch (e) {
          console.log('❌ Invalid JSON response:', data);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Request failed:', e.message);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTestData();
