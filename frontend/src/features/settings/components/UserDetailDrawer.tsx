import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import api from '@/shared/api/axiosInstance';
import type { User } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../types';
import {
  X, Pencil, KeyRound, Power, PowerOff,
  Mail, Shield, Calendar, Clock, Activity,
  User as UserIcon, Briefcase,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  user: User;
  onClose: () => void;
  onEdit: (u: User) => void;
  onResetPassword: (u: User) => void;
  onDeactivate: (u: User) => void;
  onReactivate: (u: User) => void;
}

export const UserDetailDrawer: React.FC<Props> = ({
  user,
  onClose,
  onEdit,
  onResetPassword,
  onDeactivate,
  onReactivate,
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSelf = user.id === currentUser?.id;

  const { data: auditData } = useQuery({
    queryKey: ['audit-logs-user', user.id],
    queryFn: () =>
      api.get('/audit-logs', { params: { userId: user.id, limit: 5 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const auditLogs: { id: string; action: string; entity: string; timestamp: string }[] =
    auditData?.data ?? [];

  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Détail utilisateur</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile section */}
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sky-700 text-xl font-bold">{initials}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-gray-900">{user.email}</p>
                  {isSelf && (
                    <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded-full">Vous</span>
                  )}
                </div>
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 capitalize">{ROLE_LABELS[user.role]}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                <span className={user.isActive ? 'text-emerald-600' : 'text-gray-400'}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              {user.employeeName && (
                <div className="flex items-center gap-3 text-sm">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user.employeeName}</span>
                </div>
              )}
              {user.department && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user.department}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Créé le {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Dernière connexion :{' '}
                  {user.lastLogin
                    ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true, locale: fr })
                    : 'Jamais'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-b border-gray-100 space-y-2">
            <button
              onClick={() => onEdit(user)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Modifier
            </button>
            <button
              onClick={() => onResetPassword(user)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <KeyRound className="w-4 h-4" /> Réinitialiser le mot de passe
            </button>
            {!isSelf && (
              user.isActive ? (
                <button
                  onClick={() => onDeactivate(user)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <PowerOff className="w-4 h-4" /> Désactiver
                </button>
              ) : (
                <button
                  onClick={() => onReactivate(user)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                >
                  <Power className="w-4 h-4" /> Réactiver
                </button>
              )
            )}
          </div>

          {/* Audit activity */}
          <div className="px-6 py-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" /> Activité récente
            </h4>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune activité enregistrée</p>
            ) : (
              <ul className="space-y-3">
                {auditLogs.map((log) => (
                  <li key={log.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3 h-3 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-700">
                        {log.action} — {log.entity}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
