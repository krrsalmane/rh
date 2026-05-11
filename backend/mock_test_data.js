// Mock test data for immediate testing - bypass database issues
const mockData = {
  employees: [
    {
      id: 'emp-001',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@test.com',
      companyId: 'company-001'
    },
    {
      id: 'emp-002', 
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@test.com',
      companyId: 'company-001'
    },
    {
      id: 'emp-003',
      firstName: 'Pierre', 
      lastName: 'Bernard',
      email: 'pierre.bernard@test.com',
      companyId: 'company-001'
    }
  ],
  
  leaveRequests: [
    // Jean's requests
    {
      id: 'req-001',
      employeeId: 'emp-001',
      employeeName: 'Jean Dupont',
      leaveType: 'Congés annuels',
      startDate: '2025-05-18',
      endDate: '2025-05-20',
      workingDays: 2,
      status: 'pending',
      requestedAt: '2025-05-11T10:00:00Z'
    },
    {
      id: 'req-002',
      employeeId: 'emp-001',
      employeeName: 'Jean Dupont',
      leaveType: 'Congés annuels',
      startDate: '2025-05-25',
      endDate: '2025-05-27',
      workingDays: 2,
      status: 'approved',
      requestedAt: '2025-05-11T10:00:00Z'
    },
    
    // Marie's requests
    {
      id: 'req-003',
      employeeId: 'emp-002',
      employeeName: 'Marie Martin',
      leaveType: 'Congés annuels',
      startDate: '2025-05-21',
      endDate: '2025-05-23',
      workingDays: 2,
      status: 'pending',
      requestedAt: '2025-05-11T10:00:00Z'
    },
    {
      id: 'req-004',
      employeeId: 'emp-002',
      employeeName: 'Marie Martin',
      leaveType: 'Congés annuels',
      startDate: '2025-06-10',
      endDate: '2025-06-12',
      workingDays: 2,
      status: 'pending',
      requestedAt: '2025-05-11T10:00:00Z'
    },
    
    // Pierre's requests
    {
      id: 'req-005',
      employeeId: 'emp-003',
      employeeName: 'Pierre Bernard',
      leaveType: 'Congés annuels',
      startDate: '2025-05-28',
      endDate: '2025-05-30',
      workingDays: 2,
      status: 'pending',
      requestedAt: '2025-05-11T10:00:00Z'
    },
    {
      id: 'req-006',
      employeeId: 'emp-003',
      employeeName: 'Pierre Bernard',
      leaveType: 'Congé maladie',
      startDate: '2025-06-15',
      endDate: '2025-06-16',
      workingDays: 1,
      status: 'rejected',
      requestedAt: '2025-05-11T10:00:00Z'
    }
  ],
  
  leaveBalances: [
    // Jean's balances
    {
      employeeId: 'emp-001',
      leaveType: 'Congés annuels',
      credited: 25,
      taken: 2,
      remaining: 23
    },
    {
      employeeId: 'emp-001',
      leaveType: 'Congé maladie',
      credited: 10,
      taken: 0,
      remaining: 10
    },
    
    // Marie's balances
    {
      employeeId: 'emp-002',
      leaveType: 'Congés annuels',
      credited: 25,
      taken: 0,
      remaining: 25
    },
    {
      employeeId: 'emp-002',
      leaveType: 'Congé maladie',
      credited: 10,
      taken: 0,
      remaining: 10
    },
    
    // Pierre's balances
    {
      employeeId: 'emp-003',
      leaveType: 'Congés annuels',
      credited: 25,
      taken: 0,
      remaining: 25
    },
    {
      employeeId: 'emp-003',
      leaveType: 'Congé maladie',
      credited: 10,
      taken: 1,
      remaining: 9
    }
  ]
};

console.log('📊 Mock Test Data Created');
console.log('👥 Employees:', mockData.employees.length);
console.log('📋 Leave Requests:', mockData.leaveRequests.length);
console.log('💰 Leave Balances:', mockData.leaveBalances.length);

// Show employee-specific data
console.log('\n👤 Employee-Specific View:');
mockData.employees.forEach(emp => {
  const requests = mockData.leaveRequests.filter(req => req.employeeId === emp.id);
  const balances = mockData.leaveBalances.filter(bal => bal.employeeId === emp.id);
  
  console.log(`\n${emp.firstName} ${emp.lastName} (${emp.email}):`);
  console.log(`  Leave Requests: ${requests.length}`);
  requests.forEach(req => {
    console.log(`    - ${req.leaveType}: ${req.status} (${req.startDate} → ${req.endDate})`);
  });
  console.log(`  Leave Balances: ${balances.length}`);
  balances.forEach(bal => {
    console.log(`    - ${bal.leaveType}: ${bal.remaining}/${bal.credited} days remaining`);
  });
});

// Export for use in API testing
module.exports = mockData;
