import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setTheme, setMobileSidebarOpen } from '@/store/uiSlice';
import { Sidebar } from './Sidebar';
import { Sun, Moon, Menu, LogOut, ChevronDown } from 'lucide-react';
import { authApi } from '@/features/auth/api';
import { clearCredentials } from '@/store/authSlice';

// Map route paths to French page titles
const PAGE_TITLES: Record<string, string> = {
  '/':             'Tableau de bord',
  '/employees':    'Employés',
  '/documents':    'Documents',
  '/templates':    'Modèles',
  '/time':         'Gestion du temps',
  '/absences':     'Absences',
  '/leaves':       'Congés',
  '/settings':     'Paramètres',
  '/audit-logs':   'Journaux d\'audit',
  '/users':        'Utilisateurs',
};

export function AppLayout() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { sidebarCollapsed, theme } = useAppSelector((state) => state.ui);
  const { user, role } = useAppSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Maya HR';

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    dispatch(clearCredentials());
    window.location.href = '/login';
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ── Topbar ── */}
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 flex-shrink-0 z-40">
          {/* Left: mobile menu + page title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => dispatch(setMobileSidebarOpen(true))}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-gray-800">{pageTitle}</h2>
          </div>

          {/* Right: theme, bell, user */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              title="Changer de thème"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative pl-3 ml-1 border-l border-gray-200">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2.5 hover:bg-gray-50 p-1 rounded-lg transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800 leading-none">
                    {user?.email}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 shadow">
                  <span className="text-white text-xs font-bold">{initials}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded mt-1">
                        {role?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
