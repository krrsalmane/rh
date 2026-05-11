// Test database connection
const mysql = require('mysql2/promise');

async function testConnection() {
  let connection;
  try {
    console.log('🔍 Testing database connection...');
    
    // Database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrms_db',
      port: 3306
    });
    
    console.log('✅ Database connected successfully');
    
    // Test basic query
    const [result] = await connection.execute('SELECT COUNT(*) as count FROM companies');
    console.log(`📊 Companies count: ${result[0][0].count}`);
    
    const [empResult] = await connection.execute('SELECT COUNT(*) as count FROM employees');
    console.log(`📊 Employees count: ${empResult[0][0].count}`);
    
    const [leaveResult] = await connection.execute('SELECT COUNT(*) as count FROM leave_requests');
    console.log(`📊 Leave requests count: ${leaveResult[0][0].count}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();
