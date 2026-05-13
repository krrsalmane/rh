import React, { useState } from 'react';
import { UserManagementTable } from '../components/UserManagementTable';
import { CompanySettings } from '../components/CompanySettings';
import { PublicHolidaysSettings } from '../components/PublicHolidaysSettings';
import { NotificationSettings } from '../components/NotificationSettings';
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
      <div className="space-y-8 max-w-[1600px] mx-auto animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Paramètres du Système</h1>
          <p className="text-slate-500 font-medium">Gérez la configuration globale et les accès de votre plateforme</p>
        </div>

        {/* Tabs navigation */}
        <div className="bg-slate-50 p-1.5 rounded-2xl inline-flex border border-slate-100">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content area */}
        <div className="mt-8 transition-all duration-300">
          {activeTab === 'users' && <UserManagementTable />}
          {activeTab === 'company' && <CompanySettings />}
          {activeTab === 'holidays' && <PublicHolidaysSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </RoleGuard>
  );
};
