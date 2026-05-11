import * as dashboardRepository from './dashboard.repository';
import * as auditRepository from '../audit-logs/auditLogs.repository';
import * as publicHolidaysRepository from '../public-holidays/publicHolidays.repository';
import { query } from '../../config/database';

export async function getDashboardData(user: any) {
  const { companyId, role, id: userId } = user;

  const stats = role === 'manager' 
    ? await dashboardRepository.getManagerStats(userId, companyId)
    : role === 'employee'
    ? await dashboardRepository.getEmployeeStats(userId, companyId)
    : await dashboardRepository.getGlobalStats(companyId);

  const distribution = (role === 'super_admin' || role === 'hr_agent')
    ? await dashboardRepository.getDepartmentDistribution(companyId)
    : [];

  const trends = (role === 'super_admin' || role === 'hr_agent')
    ? await dashboardRepository.getAbsenceTrends(companyId)
    : [];

  // Phase 3: Actionable Alerts
  let alerts: any[] = [];
  if (role === 'super_admin' || role === 'hr_agent') {
    // Mock expiration alert: CDD hired ~11 months ago
    const expiringSoon = await query(
      `SELECT first_name, last_name, hire_date 
       FROM employees 
       WHERE company_id = $1 AND contract_type = 'CDD' 
       AND hire_date <= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
       AND hire_date > DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`,
      [companyId]
    );
    
    alerts = expiringSoon.rows.map((e: any) => ({
      type: 'contract_expiry',
      title: 'Fin de contrat proche',
      description: `Le contrat CDD de ${e.first_name} ${e.last_name} arrive à échéance prochainement.`,
      severity: 'warning'
    }));
  }

  const recentActivity = await auditRepository.findAll({ page: 1, limit: 5 }, companyId);
  const nextHoliday = await publicHolidaysRepository.findNextHoliday(companyId);

  return {
    stats,
    distribution,
    trends,
    alerts,
    nextHoliday,
    recentActivity: recentActivity.items
  };
}
