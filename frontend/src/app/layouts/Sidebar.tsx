import { NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearCredentials } from '@/store/authSlice';
import { toggleSidebar } from '@/store/uiSlice';
import { authApi } from '@/features/auth/api';
import { getNavForRole } from '@/shared/constants/navigation.ts';
import { cn } from '@/shared/utils/cn';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'text-fuchsia-400 bg-fuchsia-400/10',
  hr_agent: 'text-sky-400 bg-sky-400/10',
  manager: 'text-amber-400 bg-amber-400/10',
  employee: 'text-emerald-400 bg-emerald-400/10',
};

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, role } = useAppSelector((state) => state.auth);

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';
  const navSections = getNavForRole(role);

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
    <aside
      className={cn(
        'h-screen bg-slate-900 flex flex-col z-50 transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ── Top: logo + collapse toggle ── */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-slate-800 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/assets/images/mayagroup-logo.png"
              alt="PROFImax"
              className="h-24 object-contain"
            />
          </div>
        )}

        <button
          onClick={() => dispatch(toggleSidebar())}
          className={cn(
            'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0',
            collapsed && 'w-8 h-8 flex items-center justify-center'
          )}
          title={collapsed ? 'Développer' : 'Réduire'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Nav sections ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {navSections.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1.5">
                {section.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                          isActive
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                          collapsed && 'justify-center px-0'
                        )
                      }
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Bottom: user card ── */}
      <div className="border-t border-slate-800 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-none bg-sky-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-none text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-none">
            <div className="w-9 h-9 rounded-none bg-sky-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-900/40">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white items-center truncate">
                {user?.email}
              </p>
              <span className={cn(
                'inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5',
                role ? ROLE_COLORS[role] : 'text-slate-400 bg-slate-800'
              )}>
                {role?.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
