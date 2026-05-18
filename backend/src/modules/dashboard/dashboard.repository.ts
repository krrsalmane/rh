import { query } from '../../config/database';

export async function getGlobalStats(companyId: string) {
  const [employees, users, pendingLeaves, pendingAbsences] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*) as count FROM employees WHERE company_id = $1 AND status = \'active\'', [companyId]),
    query<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE company_id = $1', [companyId]),
    query<{ count: string }>('SELECT COUNT(*) as count FROM leave_requests WHERE company_id = $1 AND status = \'pending\'', [companyId]),
    query<{ count: string }>('SELECT COUNT(*) as count FROM absences WHERE company_id = $1 AND justification_status = \'pending\'', [companyId]),
  ]);

  return {
    totalEmployees: parseInt(employees.rows[0].count, 10),
    totalUsers: parseInt(users.rows[0].count, 10),
    pendingLeaves: parseInt(pendingLeaves.rows[0].count, 10),
    pendingAbsences: parseInt(pendingAbsences.rows[0].count, 10),
  };
}

export async function getDepartmentDistribution(companyId: string) {
  const result = await query<{ department: string, count: string }>(
    `SELECT department, COUNT(*) as count 
     FROM employees 
     WHERE company_id = $1 AND department IS NOT NULL AND status = 'active'
     GROUP BY department`,
    [companyId]
  );
  return result.rows.map(r => ({
    name: r.department,
    value: parseInt(r.count, 10)
  }));
}

export async function getAbsenceTrends(companyId: string, months: number = 6) {
  const result = await query<{ month: string, count: string }>(
    `SELECT DATE_FORMAT(start_date, '%Y-%m') as month, COUNT(*) as count
     FROM absences
     WHERE company_id = $1 AND start_date >= DATE_SUB(NOW(), INTERVAL $2 MONTH)
     GROUP BY month
     ORDER BY month ASC`,
    [companyId, months]
  );
  return result.rows.map(r => ({
    month: r.month,
    count: parseInt(r.count, 10)
  }));
}

export async function getManagerStats(userId: string, companyId: string) {
  // 1. Get manager's department
  const managerDeptResult = await query<{ department: string }>(
    `SELECT e.department FROM employees e
     JOIN users u ON e.id = u.employee_id
     WHERE u.id = $1 AND u.company_id = $2`,
    [userId, companyId]
  );
  const department = managerDeptResult.rows[0]?.department;

  if (!department) {
    return { teamSize: 0, pendingLeaves: 0 };
  }

  // 2. Get stats for that department
  const [teamSize, pendingLeaves] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*) as count FROM employees WHERE department = $1 AND company_id = $2 AND status = \'active\'', [department, companyId]),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE e.department = $1 AND lr.company_id = $2 AND lr.status = 'pending'`,
      [department, companyId]
    ),
  ]);

  return {
    teamSize: parseInt(teamSize.rows[0].count, 10),
    pendingLeaves: parseInt(pendingLeaves.rows[0].count, 10),
  };
}

export async function getEmployeeStats(employeeId: string, companyId: string) {
  const [pendingLeaves, pendingTasks, availableBalance] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*) as count FROM leave_requests WHERE employee_id = $1 AND company_id = $2 AND status = \'pending\'', [employeeId, companyId]),
    query<{ count: string }>('SELECT COUNT(*) as count FROM tasks WHERE assigned_to = $1 AND company_id = $2 AND status != \'completed\'', [employeeId, companyId]),
    query<{ sum: string }>(
      `SELECT SUM(lb.remaining) as sum 
       FROM leave_balances lb 
       JOIN employees e ON lb.employee_id = e.id 
       WHERE lb.employee_id = $1 AND e.company_id = $2 
       AND lb.year = YEAR(CURRENT_DATE())`,
      [employeeId, companyId]
    ),
  ]);

  return {
    pendingLeaves: parseInt(pendingLeaves.rows[0].count, 10),
    pendingTasks: parseInt(pendingTasks.rows[0].count, 10),
    availableBalance: parseFloat(availableBalance.rows[0].sum || '0'),
  };
}
