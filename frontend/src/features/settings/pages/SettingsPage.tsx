import React, { useState } from 'react';
import { UserManagementTable } from '../components/UserManagementTable';
import { RoleGuard } from '@/app/router/RoleGuard';
import { Users, Building2, CalendarHeart, Bell } from 'lucide-react';

const TABS = [
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'company', label: 'Entreprise', icon: Building2 },
  { id: 'holidays', label: 'Jours fériés', icon: CalendarHeart },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const;

type TabId = (typeof TABS)[number]['id'];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('users');

  return (
    <RoleGuard roles={['super_admin']}>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les configurations de votre plateforme</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 pb-3 text-sm font-medium border-b-2 transition-colors ${isActive
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'users' && <UserManagementTable />}
        {activeTab === 'company' && (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-lg">Page en cours de développement</p>
          </div>
        )}
        {activeTab === 'holidays' && (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-lg">Page en cours de développement</p>
          </div>
        )}
        {activeTab === 'notifications' && (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-lg">Page en cours de développement</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};
