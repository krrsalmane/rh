import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useUsers, useDeactivateUser, useReactivateUser, useResetPassword, useDeleteUser } from '../hooks/useUsers';
import type { User, UserFilters } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../types';
import { UserFormModal } from '@/features/settings/components/UserFormModal.tsx';
import { ResetPasswordModal } from '@/features/settings/components/ResetPasswordModal.tsx';
import { DeleteUserConfirm } from '@/features/settings/components/DeleteUserConfirm.tsx';
import { UserDetailDrawer } from '@/features/settings/components/UserDetailDrawer.tsx';
import {
  Search, UserPlus, Pencil, KeyRound, MoreHorizontal,
  ChevronLeft, ChevronRight, Inbox, X,
  Power, PowerOff, Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const ROLES: { value: string; label: string }[] = [
  { value: '', label: 'Tous les rôles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'hr_agent', label: 'Agent RH' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employé' },
];

const STATUSES: { value: string; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'true', label: 'Actif' },
  { value: 'false', label: 'Inactif' },
];

export const UserManagementTable: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    isActive: '',
    page: 1,
    limit: 10,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPwResult, setResetPwResult] = useState<{ email: string; password: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useUsers(filters);
  const deactivateMut = useDeactivateUser();
  const reactivateMut = useReactivateUser();
  const resetPwMut = useResetPassword();
  const deleteMut = useDeleteUser();

  const users: User[] = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const hasFilters = !!(filters.search || filters.role || filters.isActive);

  const handleResetPassword = async (user: User) => {
    setOpenMenuId(null);
    const result = await resetPwMut.mutateAsync(user.id);
    setResetPwResult({ email: user.email, password: result.data.temporaryPassword });
  };

  const getInitials = (email: string) => email.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">Utilisateurs</h2>
          <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
            {pagination.total}
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-all shadow-md shadow-sky-500/20 hover:-translate-y-0.5"
        >
          <UserPlus className="w-4 h-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par email..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all bg-white"
          />
        </div>
        <select
          value={filters.role}
          onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-sky-400 bg-white min-w-[150px]"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={filters.isActive}
          onChange={(e) => setFilters((f) => ({ ...f, isActive: e.target.value, page: 1 }))}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-sky-400 bg-white min-w-[130px]"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => setFilters({ search: '', role: '', isActive: '', page: 1, limit: 10 })}
            className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl flex items-center gap-1.5 bg-white"
          >
            <X className="w-3.5 h-3.5" /> Effacer
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Employé lié</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Dernière connexion</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gray-100" /><div className="space-y-1.5"><div className="w-36 h-3 bg-gray-100 rounded" /><div className="w-20 h-2.5 bg-gray-100 rounded" /></div></div></td>
                    <td className="px-5 py-4"><div className="w-16 h-5 bg-gray-100 rounded-full" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><div className="w-28 h-3 bg-gray-100 rounded" /></td>
                    <td className="px-5 py-4"><div className="w-14 h-5 bg-gray-100 rounded-full" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="w-20 h-3 bg-gray-100 rounded" /></td>
                    <td className="px-5 py-4"><div className="w-20 h-3 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm font-medium">Aucun utilisateur trouvé</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer ${!user.isActive ? 'opacity-50' : ''}`}
                      onClick={() => setDetailUser(user)}
                    >
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sky-700 text-xs font-bold">{getInitials(user.email)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 truncate">{user.email}</p>
                              {isSelf && (
                                <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                  Vous
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      {/* Employee */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {user.employeeName ? (
                          <div>
                            <p className="text-gray-800 text-sm">{user.employeeName}</p>
                            {user.department && <p className="text-gray-400 text-xs">{user.department}</p>}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Non lié</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                          <span className={`text-xs font-medium ${user.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </td>
                      {/* Last login */}
                      <td className="px-5 py-3.5 hidden md:table-cell text-gray-500 text-xs">
                        {user.lastLogin
                          ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true, locale: fr })
                          : 'Jamais'}
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditUser(user)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Réinitialiser le mot de passe"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openMenuId === user.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                                  {!isSelf && (
                                    user.isActive ? (
                                      <button
                                        onClick={() => { deactivateMut.mutate(user.id); setOpenMenuId(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <PowerOff className="w-4 h-4" /> Désactiver
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => { reactivateMut.mutate(user.id); setOpenMenuId(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                      >
                                        <Power className="w-4 h-4" /> Réactiver
                                      </button>
                                    )
                                  )}
                                  {!isSelf && (
                                    <button
                                      onClick={() => { setDeleteTarget(user); setOpenMenuId(null); }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" /> Supprimer
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    pagination.page === i + 1
                      ? 'bg-sky-500 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {(showCreate || editUser) && (
        <UserFormModal
          user={editUser}
          onClose={() => { setShowCreate(false); setEditUser(null); }}
        />
      )}

      {resetPwResult && (
        <ResetPasswordModal
          email={resetPwResult.email}
          password={resetPwResult.password}
          onClose={() => setResetPwResult(null)}
        />
      )}

      {deleteTarget && (
        <DeleteUserConfirm
          user={deleteTarget}
          onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {detailUser && (
        <UserDetailDrawer
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onEdit={(u: User) => { setDetailUser(null); setEditUser(u); }}
          onResetPassword={handleResetPassword}
          onDeactivate={(u: User) => { deactivateMut.mutate(u.id); setDetailUser(null); }}
          onReactivate={(u: User) => { reactivateMut.mutate(u.id); setDetailUser(null); }}
        />
      )}
    </div>
  );
};
