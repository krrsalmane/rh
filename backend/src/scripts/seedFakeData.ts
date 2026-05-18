import pool, { query } from '../config/database';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const PASSWORD_HASH = '$2a$10$CrjaW3dVTfFaESCwqyty6OvOE.gX/ttyYA0L4gV9PIyqOk.gLGU3S'; // Admin@1234

interface IdRow {
  id: string;
}

interface CountRow {
  count: string;
}

async function getOrCreateWorkScheduleId(
  name: string,
  weeklyHours: number,
  dailyHours: number,
  workDays: number[],
  breakMinutes: number,
  isRotating: 0 | 1
): Promise<string> {
  const existing = await query<IdRow>(
    'SELECT id FROM work_schedules WHERE company_id = $1 AND name = $2 LIMIT 1',
    [COMPANY_ID, name]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  await query(
    `INSERT INTO work_schedules (company_id, name, weekly_hours, daily_hours, work_days, break_minutes, is_rotating)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [COMPANY_ID, name, weeklyHours, dailyHours, JSON.stringify(workDays), breakMinutes, isRotating]
  );

  const created = await query<IdRow>(
    'SELECT id FROM work_schedules WHERE company_id = $1 AND name = $2 LIMIT 1',
    [COMPANY_ID, name]
  );
  return created.rows[0].id;
}

async function getOrCreateEmployeeId(
  firstName: string,
  lastName: string,
  email: string,
  department: string,
  roleFunction: string,
  workScheduleId: string,
  salary: number,
  contractType: 'CDI' | 'CDD' | 'internship' | 'freelance' = 'CDI'
): Promise<string> {
  const existing = await query<IdRow>('SELECT id FROM employees WHERE company_id = $1 AND email = $2 LIMIT 1', [
    COMPANY_ID,
    email,
  ]);
  if (existing.rows[0]) return existing.rows[0].id;

  await query(
    `INSERT INTO employees
      (company_id, first_name, last_name, cne, cin, address, phone, email, hire_date, contract_type, \`function\`, department, salary, status, work_schedule_id)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      COMPANY_ID,
      firstName,
      lastName,
      `CNE-${Math.floor(Math.random() * 90000 + 10000)}`,
      `CIN-${Math.floor(Math.random() * 90000 + 10000)}`,
      'Casablanca',
      '+212600000000',
      email,
      '2024-01-01',
      contractType,
      roleFunction,
      department,
      salary,
      'active',
      workScheduleId,
    ]
  );

  const created = await query<IdRow>('SELECT id FROM employees WHERE company_id = $1 AND email = $2 LIMIT 1', [
    COMPANY_ID,
    email,
  ]);
  return created.rows[0].id;
}

async function upsertUser(email: string, role: 'super_admin' | 'hr_agent' | 'manager' | 'employee', employeeId: string | null) {
  await query(
    `INSERT INTO users (company_id, email, password_hash, \`role\`, employee_id, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       \`role\` = VALUES(\`role\`),
       employee_id = VALUES(employee_id),
       is_active = VALUES(is_active)`,
    [COMPANY_ID, email, PASSWORD_HASH, role, employeeId, 1]
  );
}

async function insertIfMissing(sqlCount: string, countParams: unknown[], sqlInsert: string, insertParams: unknown[]) {
  const exists = await query<CountRow>(sqlCount, countParams);
  if (Number(exists.rows[0].count) === 0) {
    await query(sqlInsert, insertParams);
  }
}

async function run() {
  try {
    console.log('🌱 Seeding fake test data...');

    await query(
      `INSERT INTO companies (id, name, address)
       VALUES ($1, $2, $3)
       ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address)`,
      [COMPANY_ID, 'Maya HR Company', 'Casablanca, Morocco']
    );

    const standardScheduleId = await getOrCreateWorkScheduleId('Standard 44h', 44, 8.8, [1, 2, 3, 4, 5], 60, 0);
    const shiftScheduleId = await getOrCreateWorkScheduleId('Shift 48h', 48, 8, [1, 2, 3, 4, 5, 6], 45, 1);

    const superAdminEmpId = await getOrCreateEmployeeId(
      'Sara',
      'Admin',
      'superadmin@hrms.com',
      'Management',
      'Super Admin',
      standardScheduleId,
      25000
    );
    const hrEmpId = await getOrCreateEmployeeId(
      'Nadia',
      'HR',
      'hragent@hrms.com',
      'Human Resources',
      'HR Agent',
      standardScheduleId,
      16000
    );
    const managerEmpId = await getOrCreateEmployeeId(
      'Youssef',
      'Manager',
      'manager@hrms.com',
      'Operations',
      'Operations Manager',
      standardScheduleId,
      19000
    );
    const employeeEmpId = await getOrCreateEmployeeId(
      'Amine',
      'Employee',
      'employee@hrms.com',
      'Operations',
      'Operations Officer',
      standardScheduleId,
      9000
    );
    const employee2Id = await getOrCreateEmployeeId(
      'Salma',
      'Finance',
      'salma.finance@hrms.com',
      'Finance',
      'Accountant',
      standardScheduleId,
      11000
    );
    const employee3Id = await getOrCreateEmployeeId(
      'Omar',
      'Support',
      'omar.support@hrms.com',
      'IT',
      'IT Support',
      shiftScheduleId,
      9500,
      'CDD'
    );
    const employee4Id = await getOrCreateEmployeeId(
      'Leila',
      'Intern',
      'leila.intern@hrms.com',
      'Marketing',
      'Marketing Intern',
      standardScheduleId,
      4000,
      'internship'
    );
    const employee5Id = await getOrCreateEmployeeId(
      'Sana',
      'Quality',
      'sana.qa@hrms.com',
      'Quality Assurance',
      'QA Lead',
      standardScheduleId,
      13000
    );
    const employee6Id = await getOrCreateEmployeeId(
      'Hamza',
      'Sales',
      'hamza.sales@hrms.com',
      'Sales',
      'Sales Representative',
      standardScheduleId,
      9800,
      'CDD'
    );
    const employee7Id = await getOrCreateEmployeeId(
      'Imane',
      'Operations',
      'imane.ops@hrms.com',
      'Operations',
      'Operations Coordinator',
      shiftScheduleId,
      10500
    );

    await upsertUser('superadmin@hrms.com', 'super_admin', superAdminEmpId);
    await upsertUser('hragent@hrms.com', 'hr_agent', hrEmpId);
    await upsertUser('manager@hrms.com', 'manager', managerEmpId);
    await upsertUser('employee@hrms.com', 'employee', employeeEmpId);
    await upsertUser('salma.finance@hrms.com', 'employee', employee2Id);
    await upsertUser('omar.support@hrms.com', 'employee', employee3Id);
    await upsertUser('leila.intern@hrms.com', 'employee', employee4Id);
    await upsertUser('sana.qa@hrms.com', 'manager', employee5Id);
    await upsertUser('hamza.sales@hrms.com', 'employee', employee6Id);
    await upsertUser('imane.ops@hrms.com', 'employee', employee7Id);

    await query(
      `INSERT INTO leave_types (company_id, name, annual_days, accrual_rule, carry_over_max, requires_approval, is_active)
       VALUES
         ($1, 'Congé Annuel', 26, 'monthly', 5, 1, 1),
         ($1, 'Congé Maladie', 10, 'yearly', 0, 1, 1),
         ($1, 'Congé Sans Solde', 0, 'yearly', 0, 1, 1),
         ($1, 'Congé Maternité', 98, 'yearly', 0, 1, 1)
       ON DUPLICATE KEY UPDATE
         annual_days = VALUES(annual_days),
         accrual_rule = VALUES(accrual_rule),
         carry_over_max = VALUES(carry_over_max),
         requires_approval = VALUES(requires_approval),
         is_active = VALUES(is_active)`,
      [COMPANY_ID]
    );

    const annualLeave = await query<IdRow>(
      `SELECT id FROM leave_types WHERE company_id = $1 AND name = 'Congé Annuel' LIMIT 1`,
      [COMPANY_ID]
    );
    const annualLeaveTypeId = annualLeave.rows[0].id;
    const sickLeave = await query<IdRow>(
      `SELECT id FROM leave_types WHERE company_id = $1 AND name = 'Congé Maladie' LIMIT 1`,
      [COMPANY_ID]
    );
    const sickLeaveTypeId = sickLeave.rows[0].id;

    const managerUser = await query<IdRow>('SELECT id FROM users WHERE email = $1 LIMIT 1', ['manager@hrms.com']);
    const managerUserId = managerUser.rows[0].id;
    const hrUser = await query<IdRow>('SELECT id FROM users WHERE email = $1 LIMIT 1', ['hragent@hrms.com']);
    const hrUserId = hrUser.rows[0].id;

    await insertIfMissing(
      `SELECT COUNT(*) as count FROM leave_requests WHERE company_id = $1 AND employee_id = $2 AND start_date = $3`,
      [COMPANY_ID, employeeEmpId, '2026-05-20'],
      `INSERT INTO leave_requests (company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, approved_by, approval_note)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7, 'Auto-approved test leave')`,
      [COMPANY_ID, employeeEmpId, annualLeaveTypeId, '2026-05-20', '2026-05-22', 3, managerUserId]
    );
    await insertIfMissing(
      `SELECT COUNT(*) as count FROM leave_requests WHERE company_id = $1 AND employee_id = $2 AND start_date = $3`,
      [COMPANY_ID, employee2Id, '2026-06-03'],
      `INSERT INTO leave_requests (company_id, employee_id, leave_type_id, start_date, end_date, working_days, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [COMPANY_ID, employee2Id, annualLeaveTypeId, '2026-06-03', '2026-06-07', 5]
    );
    await insertIfMissing(
      `SELECT COUNT(*) as count FROM leave_requests WHERE company_id = $1 AND employee_id = $2 AND start_date = $3`,
      [COMPANY_ID, employee3Id, '2026-04-14'],
      `INSERT INTO leave_requests (company_id, employee_id, leave_type_id, start_date, end_date, working_days, status, approved_by, approval_note)
       VALUES ($1, $2, $3, $4, $5, $6, 'rejected', $7, 'Insufficient balance')`,
      [COMPANY_ID, employee3Id, sickLeaveTypeId, '2026-04-14', '2026-04-15', 2, hrUserId]
    );
    await insertIfMissing(
      `SELECT COUNT(*) as count FROM leave_requests WHERE company_id = $1 AND employee_id = $2 AND start_date = $3`,
      [COMPANY_ID, employee4Id, '2026-03-11'],
      `INSERT INTO leave_requests (company_id, employee_id, leave_type_id, start_date, end_date, working_days, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'cancelled')`,
      [COMPANY_ID, employee4Id, annualLeaveTypeId, '2026-03-11', '2026-03-12', 2]
    );

    await insertIfMissing(
      `SELECT COUNT(*) as count FROM absences WHERE company_id = $1 AND employee_id = $2 AND start_date = $3`,
      [COMPANY_ID, employeeEmpId, '2026-04-10'],
      `INSERT INTO absences (company_id, employee_id, start_date, end_date, type, justification_status, reason, attachments, reviewed_by, review_note)
       VALUES ($1, $2, $3, $4, 'sick', 'justified', 'Doctor appointment', '[]', $5, 'Medical certificate received')`,
      [COMPANY_ID, employeeEmpId, '2026-04-10', '2026-04-10', managerUserId]
    );
    await insertIfMissing(
      `SELECT COUNT(*) as count FROM absences WHERE company_id = $1 AND employee_id = $2 AND start_date = $3`,
      [COMPANY_ID, employee2Id, '2026-04-16'],
      `INSERT INTO absences (company_id, employee_id, start_date, end_date, type, justification_status, reason)
       VALUES ($1, $2, $3, $4, 'late', 'pending', 'Traffic delay')`,
      [COMPANY_ID, employee2Id, '2026-04-16', '2026-04-16']
    );
    await insertIfMissing(
      `SELECT COUNT(*) as count FROM absences WHERE company_id = $1 AND employee_id = $2 AND start_date = $3`,
      [COMPANY_ID, employee3Id, '2026-04-19'],
      `INSERT INTO absences (company_id, employee_id, start_date, end_date, type, justification_status, reason, reviewed_by, review_note)
       VALUES ($1, $2, $3, $4, 'unexcused', 'unjustified', 'No show', $5, 'No valid proof')`,
      [COMPANY_ID, employee3Id, '2026-04-19', '2026-04-19', managerUserId]
    );

    const timeEntries: Array<[string, string, string, number, number, string, string]> = [
      [employeeEmpId, '2026-04-01', '09:00:00', 8, 8, 'manual', 'Normal day'],
      [employeeEmpId, '2026-04-02', '09:30:00', 7.5, 8, 'manual', 'Late start'],
      [employeeEmpId, '2026-04-03', '08:00:00', 9, 8, 'system', 'Overtime'],
      [employee2Id, '2026-04-01', '09:00:00', 8, 8, 'import', 'Imported from CSV'],
      [employee2Id, '2026-04-02', '10:00:00', 6, 8, 'manual', 'Partial day'],
      [employee3Id, '2026-04-01', '07:00:00', 8, 8, 'system', 'Shift A'],
      [employee3Id, '2026-04-02', '07:00:00', 8, 8, 'system', 'Shift A'],
      [employee4Id, '2026-04-01', '09:00:00', 4, 8, 'manual', 'Intern half-day'],
    ];

    for (const [employeeId, day, clockIn, totalHours, expectedHours, source, reason] of timeEntries) {
      const dayExists = await query<CountRow>(
        'SELECT COUNT(*) as count FROM time_entries WHERE company_id = $1 AND employee_id = $2 AND date = $3',
        [COMPANY_ID, employeeId, day]
      );
      if (Number(dayExists.rows[0].count) === 0) {
        const deficit = Math.max(0, expectedHours - totalHours);
        const overtime = Math.max(0, totalHours - expectedHours);
        await query(
          `INSERT INTO time_entries (company_id, employee_id, date, clock_in, clock_out, total_hours, expected_hours, overtime, deficit, source, modified_by, reason)
           VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10, $11)`,
          [COMPANY_ID, employeeId, day, clockIn, totalHours, expectedHours, overtime, deficit, source, managerUserId, reason]
        );
      }
    }

    const holidays = [
      ['Jour de l\'An', '2026-01-01', 2026],
      ['Fête du Travail', '2026-05-01', 2026],
      ['Fête du Trône', '2026-07-30', 2026],
      ['Marche Verte', '2026-11-06', 2026],
    ];
    for (const [name, date, year] of holidays) {
      await insertIfMissing(
        'SELECT COUNT(*) as count FROM public_holidays WHERE company_id = $1 AND name = $2 AND date = $3',
        [COMPANY_ID, name, date],
        'INSERT INTO public_holidays (company_id, name, date, year) VALUES ($1, $2, $3, $4)',
        [COMPANY_ID, name, date, year]
      );
    }

    const templates = [
      ['Attestation simple', 'attestation', 'active', '<p>Attestation pour {{employee.fullName}}</p>'],
      ['Avertissement disciplinaire', 'warning', 'draft', '<p>Avertissement: {{form.reason}}</p>'],
      ['Contrat CDD', 'contract', 'archived', '<p>Contrat CDD pour {{employee.fullName}}</p>'],
    ] as const;
    for (const [name, category, status, body] of templates) {
      await insertIfMissing(
        'SELECT COUNT(*) as count FROM templates WHERE company_id = $1 AND name = $2',
        [COMPANY_ID, name],
        `INSERT INTO templates (company_id, name, category, language, body, variable_schema, version, status, created_by)
         VALUES ($1, $2, $3, 'fr', $4, '[]', 1, $5, $6)`,
        [COMPANY_ID, name, category, body, status, hrUserId]
      );
    }

    const templatesByName = await query<{ id: string; name: string }>(
      'SELECT id, name FROM templates WHERE company_id = $1',
      [COMPANY_ID]
    );
    const templateMap = Object.fromEntries(templatesByName.rows.map((t) => [t.name, t.id]));

    const docs: Array<[string, string, string, string, string]> = [
      [employeeEmpId, templateMap['Attestation simple'], 'generated', '{"purpose":"bank"}', '/tmp/doc-generated.pdf'],
      [employee2Id, templateMap['Avertissement disciplinaire'], 'archived', '{"reason":"late"}', '/tmp/doc-archived.pdf'],
      [employee3Id, templateMap['Contrat CDD'], 'deleted', '{"contractMonths":12}', '/tmp/doc-deleted.pdf'],
    ];
    for (const [empId, tplId, status, formData, path] of docs) {
      if (!tplId) continue;
      await insertIfMissing(
        'SELECT COUNT(*) as count FROM generated_documents WHERE company_id = $1 AND employee_id = $2 AND template_id = $3 AND status = $4',
        [COMPANY_ID, empId, tplId, status],
        `INSERT INTO generated_documents (company_id, employee_id, template_id, template_version, form_data, pdf_path, status, generated_by)
         VALUES ($1, $2, $3, 1, $4, $5, $6, $7)`,
        [COMPANY_ID, empId, tplId, formData, path, status, managerUserId]
      );
    }

    const auditEvents: Array<[string, string, string, string, string]> = [
      ['CREATE', 'employee', employeeEmpId, '{}', '{"status":"active"}'],
      ['UPDATE', 'leave_request', employee2Id, '{"status":"pending"}', '{"status":"approved"}'],
      ['DELETE', 'document', employee3Id, '{"status":"generated"}', '{"status":"deleted"}'],
    ];
    for (const [action, entity, entityId, oldValue, newValue] of auditEvents) {
      await insertIfMissing(
        'SELECT COUNT(*) as count FROM audit_logs WHERE company_id = $1 AND action = $2 AND entity = $3 AND entity_id = $4',
        [COMPANY_ID, action, entity, entityId],
        `INSERT INTO audit_logs (company_id, user_id, action, entity, entity_id, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [COMPANY_ID, managerUserId, action, entity, entityId, oldValue, newValue]
      );
    }

    console.log('✅ Fake test data inserted successfully');
    console.log('🔐 Login password for all seeded users: Admin@1234');
    console.log('   - superadmin@hrms.com');
    console.log('   - hragent@hrms.com');
    console.log('   - manager@hrms.com');
    console.log('   - employee@hrms.com');
    console.log('   - salma.finance@hrms.com');
    console.log('   - omar.support@hrms.com');
    console.log('   - leila.intern@hrms.com');
    console.log('   - sana.qa@hrms.com');
    console.log('   - hamza.sales@hrms.com');
    console.log('   - imane.ops@hrms.com');
  } catch (error) {
    console.error('❌ Failed to seed fake data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
