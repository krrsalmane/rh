import { UserRole } from '@/store/authSlice';
import {
  LayoutDashboard,
  Users,
  FileText,
  FilePlus,
  Clock,
  UserX,
  CalendarDays,
  Settings,
  Shield,
  LucideIcon
} from 'lucide-react';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  roles: UserRole[];
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    section: 'PRINCIPAL',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['super_admin','hr_agent','manager','employee'] },
    ]
  },
  {
    section: 'GESTION RH',
    items: [
      { label: 'Employés', icon: Users, path: '/employees', roles: ['super_admin','hr_agent','manager'] },
      { label: 'Documents', icon: FileText, path: '/documents', roles: ['super_admin','hr_agent'] },
      { label: 'Modèles', icon: FilePlus, path: '/templates', roles: ['super_admin','hr_agent'] },
    ]
  },
  {
    section: 'PRÉSENCE',
    items: [
      { label: 'Temps', icon: Clock, path: '/time', roles: ['super_admin','hr_agent','manager','employee'] },
      { label: 'Absences', icon: UserX, path: '/absences', roles: ['super_admin','hr_agent','manager','employee'] },
      { label: 'Congés', icon: CalendarDays, path: '/leaves', roles: ['super_admin','hr_agent','manager','employee'] },
    ]
  },
  {
    section: 'ADMINISTRATION',
    items: [
      { label: 'Paramètres', icon: Settings, path: '/settings', roles: ['super_admin'] },
      { label: 'Audit', icon: Shield, path: '/audit-logs', roles: ['super_admin','hr_agent'] },
    ]
  },
];

export function getNavForRole(role?: UserRole | null): NavSection[] {
  if (!role) return [];
  return NAVIGATION
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(role))
    }))
    .filter(section => section.items.length > 0);
}
