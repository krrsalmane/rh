const http = require('http');

function testLeaveManagement() {
  console.log('🔍 Testing leave management workflow...');
  
  // Get fresh token for testing
  const loginData = JSON.stringify({
    email: 'superadmin@atlastech.ma',
    password: 'Admin@1234'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const loginResponse = JSON.parse(data);
        const token = loginResponse.data.accessToken;
        
        console.log('✅ Login successful');
        
        // Test 1: Create leave request as manager for another employee
        testCreateLeave(token);
        
        // Test 2: Get leave requests (should exclude manager's own requests)
        testGetLeaves(token);
        
        // Test 3: Try to create leave for self (should fail for manager)
        testManagerSelfLeave(token);
      } else {
        console.log('❌ Login failed');
        console.log('📋 Error:', data);
      }
    });
  });

  loginReq.on('error', (error) => {
    console.error('❌ Login test failed:', error.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}

function testCreateLeave(token) {
  console.log('\n🔍 Testing leave creation for employee...');
  
  const leaveData = JSON.stringify({
    employeeId: 'emp11111-1111-1111-1111-111111111111', // Salmane Karroum
    leaveTypeId: '1',
    startDate: '2026-05-15',
    endDate: '2026-05-16',
    workingDays: 2,
    reason: 'Test leave request'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/leaves',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(leaveData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 201) {
        console.log('✅ Leave request created successfully');
        const response = JSON.parse(data);
        console.log('📋 Leave ID:', response.data.id);
      } else {
        console.log('❌ Leave creation failed');
        console.log('📋 Error:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Leave creation test failed:', error.message);
  });

  req.write(leaveData);
  req.end();
}

function testGetLeaves(token) {
  console.log('\n🔍 Testing leave requests list...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/leaves?page=1&limit=10',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Leave requests retrieved successfully');
        const response = JSON.parse(data);
        console.log(`📋 Found ${response.data?.length || 0} leave requests`);
        
        // Check if superadmin's own requests are excluded when using manager role
        if (response.data && response.data.length > 0) {
          const hasOwnRequests = response.data.some(req => 
            req.employee_name && req.employee_name.includes('Salmane')
          );
          console.log(`📋 Manager's own requests excluded: ${!hasOwnRequests ? 'YES' : 'NO'}`);
        }
      } else {
        console.log('📋 No leave requests found');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Get leaves test failed:', error.message);
  });

  req.end();
}

function testManagerSelfLeave(token) {
  console.log('\n🔍 Testing manager self-leave restriction...');
  
  const leaveData = JSON.stringify({
    employeeId: 'usr33333-3333-3333-3333-333333333333', // Super admin user ID
    leaveTypeId: '1',
    startDate: '2026-05-20',
    endDate: '2026-05-21',
    workingDays: 2,
    reason: 'Manager trying to create leave for self'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/leaves',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(leaveData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 403) {
        console.log('✅ Manager self-leave restriction working correctly');
        console.log('📋 Expected error received');
      } else {
        console.log('❌ Manager self-leave restriction NOT working');
        console.log('📋 Status:', res.statusCode);
        console.log('📋 Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Manager self-leave test failed:', error.message);
  });

  req.write(leaveData);
  req.end();
}

testLeaveManagement();
