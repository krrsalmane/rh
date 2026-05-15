export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_AGENT: 'hr_agent',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export const PERMISSIONS = {
  super_admin: [
    'dashboard.view',
    'employees.list', 'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
    'documents.list', 'documents.view', 'documents.generate', 'documents.delete',
    'templates.list', 'templates.view', 'templates.create', 'templates.edit', 'templates.delete',
    'time.list', 'time.view', 'time.edit', 'time.delete',
    'absences.list', 'absences.view', 'absences.create', 'absences.edit', 'absences.delete', 'absences.justify',
    'leaves.list', 'leaves.view', 'leaves.create', 'leaves.edit', 'leaves.delete', 'leaves.approve',
    'settings.view', 'settings.edit',
    'users.list', 'users.view', 'users.create', 'users.edit', 'users.delete',
    'audit.view',
  ],
  hr_agent: [
    'dashboard.view',
    'employees.list', 'employees.view', 'employees.create', 'employees.edit',
    'documents.list', 'documents.view', 'documents.generate',
    'templates.list', 'templates.view',
    'time.list', 'time.view',
    'absences.list', 'absences.view', 'absences.create', 'absences.justify',
    'leaves.list', 'leaves.view', 'leaves.create', 'leaves.approve',
  ],
  manager: [
    'dashboard.view',
    'employees.list', 'employees.view',
    'time.list', 'time.view',
    'leaves.list', 'leaves.view', 'leaves.create', 'leaves.approve',
  ],
  employee: [
    'dashboard.view',
    'employees.view',
    'time.view',
    'absences.view', 'absences.create',
    'leaves.list', 'leaves.view', 'leaves.create',
  ],
};
