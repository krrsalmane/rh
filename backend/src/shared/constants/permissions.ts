export type UserRole = 'super_admin' | 'hr_agent' | 'manager' | 'employee';

export type Permission =
  | 'employees.list'
  | 'employees.create'
  | 'employees.update'
  | 'employees.delete'
  | 'employees.view'
  | 'documents.list'
  | 'documents.create'
  | 'documents.generate'
  | 'templates.list'
  | 'templates.create'
  | 'templates.update'
  | 'templates.delete'
  | 'time.list'
  | 'time.create'
  | 'time.update'
  | 'time.manage'
  | 'absences.list'
  | 'absences.create'
  | 'absences.justify'
  | 'absences.manage'
  | 'leaves.list'
  | 'leaves.request'
  | 'leaves.approve'
  | 'leaves.manage'
  | 'settings.view'
  | 'settings.update'
  | 'users.list'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'audit.view'
  | 'dashboard.view';

export const PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'employees.list', 'employees.create', 'employees.update', 'employees.delete', 'employees.view',
    'documents.list', 'documents.create', 'documents.generate',
    'templates.list', 'templates.create', 'templates.update', 'templates.delete',
    'time.list', 'time.create', 'time.update', 'time.manage',
    'absences.list', 'absences.create', 'absences.justify', 'absences.manage',
    'leaves.list', 'leaves.request', 'leaves.approve', 'leaves.manage',
    'settings.view', 'settings.update',
    'users.list', 'users.create', 'users.update', 'users.delete',
    'audit.view',
    'dashboard.view',
  ],
  hr_agent: [
    'employees.list', 'employees.create', 'employees.update', 'employees.view',
    'documents.list', 'documents.create', 'documents.generate',
    'templates.list', 'templates.create', 'templates.update',
    'time.list', 'time.create', 'time.update', 'time.manage',
    'absences.list', 'absences.create', 'absences.justify', 'absences.manage',
    'leaves.list', 'leaves.request', 'leaves.approve', 'leaves.manage',
    'dashboard.view',
  ],
  manager: [
    'employees.list', 'employees.view',
    'documents.list',
    'time.list', 'time.create',
    'absences.list', 'absences.create',
    'leaves.list', 'leaves.request', 'leaves.approve',
    'dashboard.view',
  ],
  employee: [
    'employees.view',
    'documents.list',
    'time.list', 'time.create',
    'absences.list',
    'leaves.list', 'leaves.request',
    'dashboard.view',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission);
}
