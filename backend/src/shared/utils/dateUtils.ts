import { query } from '../../config/database';

export async function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  companyId: string
): Promise<number> {
  const holidays = await query<{ date: Date }>(
    `SELECT date FROM public_holidays WHERE company_id = $1 AND date BETWEEN $2 AND $3`,
    [companyId, startDate.toISOString(), endDate.toISOString()]
  );

  const holidayDates = new Set(
    holidays.rows.map((h) => h.date.toISOString().split('T')[0])
  );

  let workingDays = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
      workingDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}
