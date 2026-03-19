async function testApi() {
  const baseUrl = 'http://localhost:3000/api';
  console.log('🚀 Starting API tests...');

  try {
    // 1. LOGIN
    console.log('\n--- AUTH: Login ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hrms.com', password: 'Admin@1234' }),
    });

    const loginData = await loginRes.json() as any;
    if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    const token = loginData.data.accessToken;
    const user = loginData.data.user;
    if (!user) throw new Error(`User data missing in login response: ${JSON.stringify(loginData)}`);
    const companyId = user.companyId;
    console.log('✅ Login successful');
    console.log(`👤 User: ${user.email} (Role: ${user.role})`);

    // 2. ME
    console.log('\n--- AUTH: Me ---');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const meData = await meRes.json() as any;
    if (meRes.status !== 200) throw new Error(`Me failed: ${JSON.stringify(meData)}`);
    console.log('✅ Auth me successful');

    // 3. GET EMPLOYEES
    console.log('\n--- EMPLOYEES: List ---');
    const empListRes = await fetch(`${baseUrl}/employees`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const empListData = await empListRes.json() as any;
    if (empListRes.status !== 200) throw new Error(`List employees failed: ${JSON.stringify(empListData)}`);
    console.log(`✅ List employees successful (Count: ${empListData.data.length})`);

    // 4. CREATE EMPLOYEE
    console.log('\n--- EMPLOYEES: Create ---');
    const newEmp = {
      firstName: 'John',
      lastName: 'Doe',
      email: `john.doe.${Date.now()}@example.com`,
      hireDate: '2023-01-01',
      contractType: 'CDI',
      department: 'IT',
      salary: 50000
    };
    const createEmpRes = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmp),
    });
    const createEmpData = await createEmpRes.json() as any;
    if (createEmpRes.status !== 201) throw new Error(`Create employee failed: ${JSON.stringify(createEmpData)}`);
    const employeeId = createEmpData.data.id;
    console.log(`✅ Create employee successful (ID: ${employeeId})`);

    // 5. GET LEAVE TYPES
    console.log('\n--- LEAVE TYPES: List ---');
    const ltRes = await fetch(`${baseUrl}/leave-types`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const ltData = await ltRes.json() as any;
    if (ltRes.status !== 200) throw new Error(`List leave types failed: ${JSON.stringify(ltData)}`);
    console.log(`✅ List leave types successful (Count: ${ltData.data.length})`);
    ltData.data.forEach((lt: any) => console.log(`  - ${lt.name} (${lt.annual_days || 0} days)`));

    // 6. USERS: List (Super Admin only)
    console.log('\n--- USERS: List ---');
    const usersRes = await fetch(`${baseUrl}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const usersData = await usersRes.json() as any;
    if (usersRes.status !== 200) throw new Error(`List users failed: ${JSON.stringify(usersData)}`);
    console.log(`✅ List users successful (Count: ${usersData.data.length})`);

    console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨');

  } catch (error) {
    console.error('\n❌ API TEST FAILED:', error);
    process.exit(1);
  }
}

testApi();
