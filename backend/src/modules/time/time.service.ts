import * as timeRepository from './time.repository';
import { CreateTimeEntryInput, UpdateTimeEntryInput, TimeEntryFiltersInput } from './time.schema';
import * as employeesRepository from '../employees/employees.repository';
import * as workSchedulesRepository from '../work-schedules/workSchedules.repository';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';
import { query } from '../../config/database';

/**
 * TIME TRACKING SYSTEM - 24-HOUR FORMAT
 * =====================================
 * All times in this module use 24-hour format (HH:MM):
 * - Midnight: 00:00
 * - Morning: 08:00, 09:00
 * - Afternoon: 13:00, 14:00, 18:00
 * - Evening: 20:00, 21:00, 22:00
 * - Late night: 23:00, 23:59
 * 
 * No AM/PM notation is used anywhere in the system.
 * All calculations are performed using 24-hour military time.
 */

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function normalizeWorkDays(workDays: unknown): number[] | null {
  if (!workDays) return null;
  if (Array.isArray(workDays)) {
    const normalized = workDays
      .map((day) => typeof day === 'string' ? DAY_NAME_TO_NUMBER[day.toLowerCase()] : Number(day))
      .filter((value) => typeof value === 'number' && !Number.isNaN(value) && value >= 0 && value <= 6);
    return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
  }
  return null;
}

async function countScheduledDays(startDate: string, endDate: string, companyId: string, scheduleDays: number[]): Promise<number> {
  if (scheduleDays.length === 0) return 0;

  const holidays = await query<{ date: Date }>(
    'SELECT date FROM public_holidays WHERE company_id = $1 AND date BETWEEN $2 AND $3',
    [companyId, startDate, endDate]
  );
  const holidayDates = new Set(holidays.rows.map((h) => h.date.toISOString().slice(0, 10)));

  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().slice(0, 10);
    if (scheduleDays.includes(dayOfWeek) && !holidayDates.has(dateStr)) {
      count += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

async function calculateExpectedPeriodHours(employeeId: string, startDate: string, endDate: string, companyId: string): Promise<{ expectedHours: number; expectedDays: number }> {
  const employee = await employeesRepository.findById(employeeId, companyId);
  if (!employee) return { expectedHours: 0, expectedDays: 0 };
  const schedule = employee.work_schedule_id
    ? await workSchedulesRepository.findById(employee.work_schedule_id, companyId)
    : null;

  const dailyHours = employee.daily_hours ?? schedule?.daily_hours ?? 8;
  const workDays = normalizeWorkDays(schedule?.work_days) ?? [1, 2, 3, 4, 5];

  const expectedDays = await countScheduledDays(startDate, endDate, companyId, workDays);
  return { expectedHours: expectedDays * dailyHours, expectedDays };
}

export async function getTimeEntries(filters: TimeEntryFiltersInput, user: any) {
  const { companyId, role, id } = user;
  if (role === 'employee') filters.employeeId = user.employeeId || id;
  else if (role === 'manager') filters.managerId = id;
  return timeRepository.findAll(filters, companyId);
}

export async function getTimeEntryById(id: string, user: any) {
  const { companyId, role, id: userId } = user;
  const entry = await timeRepository.findById(id, companyId);
  if (!entry) throw new AppError('Time entry not found', 404);
  if (role === 'employee' && entry.employee_id !== user.employeeId && entry.employee_id !== userId) throw new AppError('Access denied', 403);
  if (role === 'manager') {
    const employee = await employeesRepository.findById(entry.employee_id, companyId);
    if (!employee || employee.manager_id !== userId) throw new AppError('Access denied', 403);
  }
  return entry;
}

export async function createTimeEntry(input: CreateTimeEntryInput, user: any) {
  const { companyId, role, id: userId } = user;
  if (role !== 'super_admin' && role !== 'hr_agent') throw new AppError('Access denied', 403);

  if (!input.expectedHours) {
    const employee = await employeesRepository.findById(input.employeeId, companyId);
    if (employee && employee.daily_hours) {
      input.expectedHours = employee.daily_hours;
    }
  }

  const entry = await timeRepository.create(input, companyId, userId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'time_entry', entityId: entry.id, newValue: input as unknown as Record<string, unknown> });
  return entry;
}

export async function updateTimeEntry(id: string, input: UpdateTimeEntryInput, user: any) {
  const { companyId, id: userId } = user;
  const existing = await timeRepository.findById(id, companyId);
  if (!existing) throw new AppError('Time entry not found', 404);
  const updated = await timeRepository.update(id, input, companyId, userId);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'time_entry', entityId: id, oldValue: existing as unknown as Record<string, unknown>, newValue: input as unknown as Record<string, unknown> });
  return updated;
}

export async function deleteTimeEntry(id: string, user: any) {
  const { companyId, id: userId } = user;
  const existing = await timeRepository.findById(id, companyId);
  if (!existing) throw new AppError('Time entry not found', 404);
  await timeRepository.remove(id, companyId);
  await auditLog({ userId, companyId, action: 'DELETE', entity: 'time_entry', entityId: id, oldValue: existing as unknown as Record<string, unknown> });
}

export async function clockIn(user: any, clockInTime?: string) {
  const { companyId, role, employeeId, id: userId } = user;
  if (role !== 'employee') throw new AppError('Access denied', 403);
  if (!employeeId) throw new AppError('Employee profile not found', 400);

  const today = new Date().toISOString().slice(0, 10);
  const time = clockInTime || new Date().toTimeString().slice(0, 5);

  const existing = await timeRepository.findByEmployeeAndDate(employeeId, today, companyId);
  if (existing) {
    return timeRepository.update(existing.id, { clockIn: time }, companyId, userId);
  }

  const input: CreateTimeEntryInput = {
    employeeId,
    date: today,
    clockIn: time,
    source: 'system',
  };
  const entry = await timeRepository.create(input, companyId, userId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'time_entry', entityId: entry.id, newValue: input as unknown as Record<string, unknown> });
  return entry;
}

export async function clockOut(user: any, clockOutTime?: string) {
  const { companyId, role, employeeId, id: userId } = user;
  if (role !== 'employee') throw new AppError('Access denied', 403);
  if (!employeeId) throw new AppError('Employee profile not found', 400);

  const today = new Date().toISOString().slice(0, 10);
  const time = clockOutTime || new Date().toTimeString().slice(0, 5);

  const existing = await timeRepository.findByEmployeeAndDate(employeeId, today, companyId);
  if (!existing) {
    throw new AppError('Pointage introuvable pour aujourd\'hui', 404);
  }
  const updated = await timeRepository.update(existing.id, { clockOut: time }, companyId, userId);
  await auditLog({ userId, companyId, action: 'UPDATE', entity: 'time_entry', entityId: existing.id, oldValue: existing as unknown as Record<string, unknown>, newValue: { clockOut: time } });
  return updated;
}

export async function recordTimeAction(user: any, action: string, actionTime?: string, employeeId?: string, date?: string) {
  const { companyId, role, id: userId, employeeId: selfEmployeeId } = user;
  const effectiveEmployeeId = role === 'employee' ? selfEmployeeId : employeeId;
  if (!effectiveEmployeeId) {
    throw new AppError('Employee ID is required', 400);
  }
  if (role === 'manager') {
    const employee = await employeesRepository.findById(effectiveEmployeeId, companyId);
    if (!employee || employee.manager_id !== userId) throw new AppError('Access denied', 403);
  }

  const today = new Date().toISOString().slice(0, 10);
  const actionDate = date || today;
  const time = actionTime || new Date().toTimeString().slice(0, 5);
  const existing = await timeRepository.findByEmployeeAndDate(effectiveEmployeeId, actionDate, companyId);

  if (action === 'morning-in') {
    if (existing && existing.clock_in) {
      throw new AppError('Morning Clock In already recorded for today', 400);
    }
  }

  if (action === 'morning-out') {
    if (!existing || (!existing.clock_in && !existing.lunch_in)) {
      throw new AppError('You must Morning Clock In before leaving', 400);
    }
    if (existing && existing.clock_out) {
       throw new AppError('Leave already recorded for today', 400);
    }
  }

  if (action === 'lunch-out') {
    if (!existing || (!existing.clock_in && !existing.lunch_in)) {
      throw new AppError('You must Morning Clock In before lunch break', 400);
    }
  }

  if (action === 'lunch-in') {
    if (!existing || !existing.lunch_out) {
      throw new AppError('You must Lunch Clock Out before returning from lunch', 400);
    }
  }

  if (action === 'prayer-out' || action === 'prayer2-out') {
    if (!existing || !existing.clock_in) {
      throw new AppError('You must Morning Clock In before prayer break', 400);
    }
  }

  if (action === 'prayer-in') {
    if (!existing || !existing.prayer_out) {
      throw new AppError('You must Prayer Clock Out before returning from prayer', 400);
    }
  }

  if (action === 'prayer2-in') {
    if (!existing || !existing.prayer2_out) {
      throw new AppError('You must Prayer 2 Clock Out before returning from prayer', 400);
    }
  }

  const payload: Partial<CreateTimeEntryInput> = { source: 'system' };
  if (action === 'morning-in') {
    payload.clockIn = time;
  }
  if (action === 'morning-out') {
    payload.clockOut = time;
  }
  if (action === 'prayer-out') {
    payload.prayerOut = time;
  }
  if (action === 'prayer-in') {
    payload.prayerIn = time;
  }
  if (action === 'prayer2-out') {
    payload.prayer2Out = time;
  }
  if (action === 'prayer2-in') {
    payload.prayer2In = time;
  }
  if (action === 'lunch-out') {
    payload.lunchOut = time;
  }
  if (action === 'lunch-in') {
    payload.lunchIn = time;
  }

  payload.reason = {
    'morning-in': 'Morning clock in',
    'morning-out': 'Morning clock out',
    'lunch-out': 'Lunch clock out',
    'lunch-in': 'Back from lunch',
    'prayer-out': 'Prayer clock out',
    'prayer-in': 'Prayer clock in',
    'prayer2-out': 'Prayer 2 clock out',
    'prayer2-in': 'Prayer 2 clock in',
  }[action];

  if (existing) {
    const updated = await timeRepository.update(existing.id, payload, companyId, userId);
    await auditLog({ userId, companyId, action: 'UPDATE', entity: 'time_entry', entityId: existing.id, oldValue: existing as unknown as Record<string, unknown>, newValue: payload as Record<string, unknown> });
    return updated;
  }

  const input: CreateTimeEntryInput = {
    employeeId: effectiveEmployeeId,
    date: actionDate,
    source: 'system',
    ...payload,
  };

  const entry = await timeRepository.create(input, companyId, userId);
  await auditLog({ userId, companyId, action: 'CREATE', entity: 'time_entry', entityId: entry.id, newValue: input as unknown as Record<string, unknown> });
  return entry;
}

export async function getTimeSummary(employeeId: string, startDate: string, endDate: string, user: any) {
  const { companyId, role, id: userId } = user;
  if (role === 'employee' && employeeId && employeeId !== user.employeeId && employeeId !== userId) throw new AppError('Access denied', 403);
  if (role === 'manager' && employeeId) {
    const employee = await employeesRepository.findById(employeeId, companyId);
    if (!employee || employee.manager_id !== userId) throw new AppError('Access denied', 403);
  }

  const targetId = role === 'employee' ? user.employeeId || userId : employeeId;
  const summary = await timeRepository.getSummary(targetId, startDate, endDate, companyId);

  let expectedHours = summary.totalExpectedHours;
  let expectedDays = 0;
  if (targetId) {
    const expectedInfo = await calculateExpectedPeriodHours(targetId, startDate, endDate, companyId);
    expectedHours = expectedInfo.expectedHours;
    expectedDays = expectedInfo.expectedDays;
  }

  return {
    period: `${startDate} - ${endDate}`,
    totalHours: summary.totalHours,
    expectedHours,
    overtime: summary.totalOvertime,
    deficit: summary.totalDeficit,
    daysWorked: summary.daysWorked,
    expectedDays,
    attendanceRate: expectedDays > 0 ? Math.min(1, summary.daysWorked / expectedDays) : 0,
  };
}

export async function exportTimeEntries(filters: TimeEntryFiltersInput, user: any) {
  const { companyId, role, id } = user;
  if (role === 'employee') filters.employeeId = user.employeeId || id;
  else if (role === 'manager') filters.managerId = id;
  return timeRepository.findForExport(filters, companyId);
}

export async function generateDefaultTimeEntries(date: string, user: any) {
  try {
    const { companyId, role, id: userId } = user;
    if (role !== 'super_admin' && role !== 'hr_agent') {
      throw new AppError('Access denied', 403);
    }

    const employeesResponse = await employeesRepository.findAll({ page: 1, limit: 1000 }, companyId);
    const employees = employeesResponse.items;

    const dayOfWeek = new Date(date).getDay();
    const dateStr = date;

    const holidays = await query<{ date: Date }>(
      'SELECT date FROM public_holidays WHERE company_id = $1 AND date = $2',
      [companyId, dateStr]
    );
    if (holidays.rows.length > 0) {
      throw new AppError('Cannot generate entries for a public holiday', 400);
    }

    let generatedCount = 0;

    for (const emp of employees) {
      const existing = await timeRepository.findByEmployeeAndDate(emp.id, dateStr, companyId);
      if (existing) continue;

      const schedule = emp.work_schedule_id
        ? await workSchedulesRepository.findById(emp.work_schedule_id, companyId)
        : null;

      const workDays = normalizeWorkDays(schedule?.work_days) ?? [1, 2, 3, 4, 5];
      const dailyHours = emp.daily_hours ?? schedule?.daily_hours ?? 8;

      if (workDays.includes(dayOfWeek)) {
        const clockIn = '09:00';
        const clockOut = '18:00';
        const lunchOut = '12:00';
        const lunchIn = '13:00';

        await timeRepository.create({
          employeeId: emp.id,
          date: dateStr,
          clockIn,
          clockOut,
          lunchOut,
          lunchIn,
          expectedHours: dailyHours,
          source: 'system',
          reason: 'Génération automatique'
        }, companyId, userId);

        generatedCount++;
      }
    }

    await auditLog({ 
      userId, 
      companyId, 
      action: 'CREATE', 
      entity: 'time_entry', 
      entityId: dateStr, 
      newValue: { message: `Generated ${generatedCount} entries for ${dateStr}` } 
    });

    return { message: `${generatedCount} pointages générés avec succès`, count: generatedCount };
  } catch (error: any) {
    console.error('Error in generateDefaultTimeEntries:', error);
    throw new AppError(`Erreur lors de la génération: ${error.message}`, 500);
  }
}
