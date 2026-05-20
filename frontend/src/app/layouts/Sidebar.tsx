import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearCredentials } from '@/store/authSlice';
import { authApi } from '@/features/auth/api';
import { getNavForRole } from '@/shared/constants/navigation.ts';
import { cn } from '@/shared/utils/cn';
import { Bell, Globe, LogOut, Menu, X } from 'lucide-react';
import { Notifications } from '@/components/Notifications';

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'text-fuchsia-400 bg-fuchsia-400/10',
  hr_agent: 'text-primary-400 bg-primary-400/10',
  manager: 'text-amber-400 bg-amber-400/10',
  employee: 'text-emerald-400 bg-emerald-400/10',
};

export function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, role } = useAppSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';
  const navSections = getNavForRole(role);
  const navItems = navSections.flatMap((section) => section.items);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    dispatch(clearCredentials());
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 z-50 w-full h-[60px] bg-[#0D1B2A] shadow-none border-b-0">
      <div className="flex h-full items-center justify-between px-6 gap-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="shrink-0 text-[22px] font-extrabold tracking-[-0.5px] text-white"
        >
          MAYA <span className="text-[#2563EB]">HR</span>
        </button>

        <nav className="hidden md:flex flex-1 items-center justify-center overflow-x-auto">
          <div className="flex items-center gap-8 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 text-[14px] font-medium text-white no-underline border-b-2 border-transparent pb-1 transition-opacity duration-200 hover:opacity-85',
                      isActive && 'font-semibold border-white'
                    )
                  }
                >
                  <Icon className="w-4 h-4 text-white/90" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-4 shrink-0">
          <button
            type="button"
            className="text-white/90 hover:text-white transition-opacity"
            title="Langue"
          >
            <Globe className="w-5 h-5" />
          </button>
          <div className="relative">
            <Notifications />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((value) => !value)}
              className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-[13px] font-semibold flex items-center justify-center"
              title={user?.email || 'Utilisateur'}
            >
              {initials}
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white shadow-lg border border-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600 mt-1">
                      {role?.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="md:hidden text-white"
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute top-[60px] left-0 w-full bg-[#0D1B2A] px-6 py-4 border-t border-white/10">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'text-white text-[15px] font-medium no-underline',
                    isActive && 'font-semibold'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
