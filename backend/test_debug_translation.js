// Test debug translation in actual document generation
const http = require('http');

// Test document generation with different languages
function testDocumentGeneration() {
  console.log('🧪 Testing Document Generation with Debug Logs...\n');
  
  const testData = {
    templateId: 'test-template-id',
    employeeId: 'test-employee-id',
    formData: {},
    language: 'ar' // Test Arabic
  };
  
  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/documents/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': 'Bearer test-token'
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log('Response:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Document generation request sent successfully');
        console.log('📋 Check backend logs for debug information');
      } else {
        console.log('❌ Document generation failed');
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
  });
  
  req.write(postData);
  req.end();
}

console.log('🌍 Testing Arabic document generation...');
testDocumentGeneration();
