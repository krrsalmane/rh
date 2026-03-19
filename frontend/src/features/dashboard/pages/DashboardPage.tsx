import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { SuperAdminDashboard } from '../components/SuperAdminDashboard';
import { HRAgentDashboard } from '../components/HRAgentDashboard';
import { ManagerDashboard } from '../components/ManagerDashboard';
import { EmployeeDashboard } from '../components/EmployeeDashboard';

export const DashboardPage: React.FC = () => {
  const role = useAppSelector((state) => state.auth.role);

  switch (role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'hr_agent':
      return <HRAgentDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Rôle non reconnu ou en cours de chargement...</p>
        </div>
      );
  }
};
