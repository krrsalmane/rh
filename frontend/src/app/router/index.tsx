import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/app/layouts/AppLayout';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { ROUTES } from '@/shared/constants/routes';

import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { EmployeesListPage } from '@/features/employees/pages/EmployeesListPage';
import { EmployeeDetailPage } from '@/features/employees/pages/EmployeeDetailPage';
import { EmployeeCreatePage } from '@/features/employees/pages/EmployeeCreatePage';
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage';
import { TemplatesPage } from '@/features/documents/pages/TemplatesPage';
import { TemplateEditorPage } from '@/features/documents/pages/TemplateEditorPage';
import { GenerateDocumentPage } from '@/features/documents/pages/GenerateDocumentPage';
import { DocumentViewPage } from '@/features/documents/pages/DocumentViewPage';
import { TimeManagementPage } from '@/features/time/pages/TimeManagementPage';
import { EmployeeTimePage } from '@/features/time/pages/EmployeeTimePage';
import { WorkSchedulesPage } from '@/features/time/pages/WorkSchedulesPage';
import { AbsencesPage } from '@/features/absences/pages/AbsencesPage';
import { AbsenceDetailPage } from '@/features/absences/pages/AbsenceDetailPage';
import { LeavesPage } from '@/features/leaves/pages/LeavesPage';
import { LeaveRequestPage } from '@/features/leaves/pages/LeaveRequestPage';
import { LeaveTypesPage } from '@/features/leaves/pages/LeaveTypesPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { UsersPage } from '@/features/users/pages/UsersPage';
import { PublicHolidaysPage } from '@/features/holidays/pages/PublicHolidaysPage';
import { AuditLogsPage } from '@/features/audit/pages/AuditLogsPage';
import { EmployeePortalPage } from '@/features/employee-portal/pages/EmployeePortalPage';
import { TasksPage } from '@/features/tasks/pages/TasksPage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
          { path: ROUTES.EMPLOYEES, element: <RoleGuard roles={['super_admin', 'hr_agent', 'manager']}><EmployeesListPage /></RoleGuard> },
          { path: ROUTES.EMPLOYEE_CREATE, element: <RoleGuard roles={['super_admin', 'hr_agent']}><EmployeeCreatePage /></RoleGuard> },
          { path: ROUTES.EMPLOYEE_DETAIL, element: <EmployeeDetailPage /> }, // Component handles its own check
          { path: ROUTES.DOCUMENTS, element: <RoleGuard roles={['super_admin', 'hr_agent']}><DocumentsPage /></RoleGuard> },
          { path: ROUTES.TEMPLATES, element: <RoleGuard roles={['super_admin', 'hr_agent']}><TemplatesPage /></RoleGuard> },
          { path: ROUTES.TEMPLATE_EDITOR, element: <RoleGuard roles={['super_admin', 'hr_agent']}><TemplateEditorPage /></RoleGuard> },
          { path: ROUTES.TEMPLATE_EDITOR_NEW, element: <RoleGuard roles={['super_admin', 'hr_agent']}><TemplateEditorPage /></RoleGuard> },
          { path: ROUTES.TEMPLATE_EDITOR_EDIT, element: <RoleGuard roles={['super_admin', 'hr_agent']}><TemplateEditorPage /></RoleGuard> },
          { path: ROUTES.GENERATE_DOCUMENT, element: <RoleGuard roles={['super_admin', 'hr_agent']}><GenerateDocumentPage /></RoleGuard> },
          { path: ROUTES.DOCUMENT_VIEW, element: <RoleGuard roles={['super_admin', 'hr_agent']}><DocumentViewPage /></RoleGuard> },
          { path: ROUTES.AUDIT_LOGS, element: <RoleGuard roles={['super_admin']}><AuditLogsPage /></RoleGuard> },
          { path: ROUTES.TASKS, element: <TasksPage /> },
          // all authenticated users
          { path: ROUTES.TIME, element: <TimeManagementPage /> },
          { path: ROUTES.EMPLOYEE_TIME, element: <EmployeeTimePage /> },
          { path: ROUTES.WORK_SCHEDULES, element: <RoleGuard roles={['super_admin', 'hr_agent']}><WorkSchedulesPage /></RoleGuard> },
          { path: ROUTES.ABSENCES, element: <RoleGuard roles={['super_admin', 'hr_agent', 'manager', 'employee']}><AbsencesPage /></RoleGuard> },
          { path: ROUTES.ABSENCE_DETAIL, element: <RoleGuard roles={['super_admin', 'hr_agent', 'manager', 'employee']}><AbsenceDetailPage /></RoleGuard> },
          { path: ROUTES.LEAVES, element: <LeavesPage /> },
          { path: ROUTES.LEAVE_REQUEST, element: <LeaveRequestPage /> },
          { path: ROUTES.LEAVE_TYPES, element: <RoleGuard roles={['super_admin', 'hr_agent']}><LeaveTypesPage /></RoleGuard> },
          // employee self-service portal
          { path: ROUTES.EMPLOYEE_PORTAL, element: <EmployeePortalPage /> },
          // super_admin only
          { path: ROUTES.SETTINGS, element: <RoleGuard roles={['super_admin']}><SettingsPage /></RoleGuard> },
          { path: ROUTES.USERS, element: <RoleGuard roles={['super_admin']}><UsersPage /></RoleGuard> },
          { path: ROUTES.PUBLIC_HOLIDAYS, element: <RoleGuard roles={['super_admin', 'hr_agent', 'manager', 'employee']}><PublicHolidaysPage /></RoleGuard> },
        ],
      },
    ],
  },
]);
