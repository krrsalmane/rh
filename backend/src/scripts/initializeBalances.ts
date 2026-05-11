import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

async function initializeLeaveBalances() {
  try {
    console.log('🔍 Initializing leave balances for all employees...');
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Get all employees
    const employeesResult = await query(`
      SELECT e.id, e.company_id, e.first_name, e.last_name
      FROM employees e
      WHERE e.status = 'active'
    `);
    const employees = employeesResult.rows;
    
    if (employees.length === 0) {
      console.log('❌ No active employees found');
      return;
    }
    
    console.log(`✅ Found ${employees.length} active employees`);
    
    // Get all leave types
    const leaveTypesResult = await query(`
      SELECT lt.id, lt.name, lt.days_per_year, lt.company_id
      FROM leave_types lt
    `);
    const leaveTypes = leaveTypesResult.rows;
    
    if (leaveTypes.length === 0) {
      console.log('❌ No leave types found');
      return;
    }
    
    console.log(`✅ Found ${leaveTypes.length} leave types`);
    
    // Create balances for each employee and leave type combination
    let createdCount = 0;
    
    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        // Only create if employee and leave type are in same company
        if (employee.company_id !== leaveType.company_id) {
          continue;
        }
        
        // Check if balance already exists
        const existingBalanceResult = await query(`
          SELECT id FROM leave_balances 
          WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3
        `, [employee.id, leaveType.id, currentYear]);
        
        if (existingBalanceResult.rows.length > 0) {
          continue; // Skip if already exists
        }
        
        // Create new balance
        const balanceId = uuidv4();
        await query(`
          INSERT INTO leave_balances (id, employee_id, leave_type_id, year, credited, taken, remaining, last_updated)
          VALUES ($1, $2, $3, $4, $5, 0, $5, NOW())
        `, [balanceId, employee.id, leaveType.id, currentYear, leaveType.days_per_year || 25]);
        
        createdCount++;
        console.log(`✅ Created balance: ${employee.first_name} ${employee.last_name} - ${leaveType.name} (${leaveType.days_per_year || 25} days)`);
      }
    }
    
    console.log(`📊 Created ${createdCount} new leave balances for year ${currentYear}`);
    
    // Show sample balances
    const sampleBalancesResult = await query(`
      SELECT lb.*, e.first_name, e.last_name, lt.name as leave_type_name
      FROM leave_balances lb
      JOIN employees e ON lb.employee_id = e.id
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.year = $1
      LIMIT 10
    `, [currentYear]);
    
    console.log('📋 Sample leave balances:');
    sampleBalancesResult.rows.forEach((balance: any) => {
      console.log(`   ${balance.first_name} ${balance.last_name} - ${balance.leave_type_name}: ${balance.remaining}/${balance.credited} days`);
    });
    
    console.log('✅ Leave balances initialized successfully!');
    
  } catch (error) {
    console.error('❌ Failed to initialize leave balances:', error);
  }
}

// Run the function
initializeLeaveBalances().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
