// Simple server to test the leave requests functionality
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// Mock data for testing
const mockData = {
  'jean.dupont@test.com': [
    {
      id: 'req-001',
      employee_id: 'emp-001',
      employee_name: 'Jean Dupont',
      leave_type_id: 'lt-001',
      leave_type_name: 'Congés annuels',
      start_date: '2025-05-18',
      end_date: '2025-05-20',
      working_days: 2,
      status: 'pending',
      requested_at: '2025-05-11T10:00:00Z'
    },
    {
      id: 'req-002',
      employee_id: 'emp-001',
      employee_name: 'Jean Dupont',
      leave_type_id: 'lt-001',
      leave_type_name: 'Congés annuels',
      start_date: '2025-05-25',
      end_date: '2025-05-27',
      working_days: 2,
      status: 'approved',
      requested_at: '2025-05-11T10:00:00Z'
    }
  ],
  'marie.martin@test.com': [
    {
      id: 'req-003',
      employee_id: 'emp-002',
      employee_name: 'Marie Martin',
      leave_type_id: 'lt-001',
      leave_type_name: 'Congés annuels',
      start_date: '2025-05-21',
      end_date: '2025-05-23',
      working_days: 2,
      status: 'pending',
      requested_at: '2025-05-11T10:00:00Z'
    }
  ]
};

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true
}));
app.use(express.json());

// Mock authentication middleware
app.use((req, res, next) => {
  // Mock user based on email or default to Jean
  const userEmail = req.headers['x-user-email'] || 'jean.dupont@test.com';
  req.user = {
    id: userEmail === 'jean.dupont@test.com' ? 'emp-001' : userEmail === 'marie.martin@test.com' ? 'emp-002' : 'emp-003',
    email: userEmail,
    role: 'employee',
    companyId: 'company-001'
  };
  next();
});

// Leave requests endpoint
app.get('/api/leaves', async (req, res) => {
  try {
    console.log('📊 API Request - User:', req.user.email, 'Role:', req.user.role);
    
    const { status } = req.query;
    let requests = mockData[req.user.email] || [];
    
    // Filter by status if provided
    if (status && status !== 'all') {
      requests = requests.filter(req => req.status === status);
    }
    
    console.log(`📋 Returning ${requests.length} requests for ${req.user.email}`);
    
    res.json({
      success: true,
      data: {
        requests: requests,
        total: requests.length,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log('👤 Test users:');
  console.log('  jean.dupont@test.com - 2 requests (1 pending, 1 approved)');
  console.log('  marie.martin@test.com - 1 request (1 pending)');
  console.log('  pierre.bernard@test.com - 0 requests');
  console.log('🔧 Use x-user-email header to test different users');
});
