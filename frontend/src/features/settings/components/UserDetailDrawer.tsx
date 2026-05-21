import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import api from '@/shared/api/axiosInstance';
import type { User } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../types';
import {
  Pencil, KeyRound, Power, PowerOff,
  Mail, Shield, Calendar, Clock, Activity,
  User as UserIcon, Briefcase,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Modal, FormCard } from '@/shared/components/forms';

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
    <Modal isOpen onClose={onClose} title="Détail utilisateur">
      <FormCard>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF6FF]">
            <span className="text-lg font-bold text-[#2563EB]">{initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#1A1A2E]">{user.email}</p>
              {isSelf && (
                <span className="rounded-full bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-bold text-[#2563EB]">
                  Vous
                </span>
              )}
            </div>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm text-[#374151]">
            <Mail className="h-4 w-4 text-[#9CA3AF]" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#374151]">
            <Shield className="h-4 w-4 text-[#9CA3AF]" />
            <span>{ROLE_LABELS[user.role]}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-gray-300'}`} />
            <span className={user.isActive ? 'text-emerald-600' : 'text-[#9CA3AF]'}>
              {user.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          {user.employeeName && (
            <div className="flex items-center gap-3 text-sm text-[#374151]">
              <UserIcon className="h-4 w-4 text-[#9CA3AF]" />
              <span>{user.employeeName}</span>
            </div>
          )}
          {user.department && (
            <div className="flex items-center gap-3 text-sm text-[#374151]">
              <Briefcase className="h-4 w-4 text-[#9CA3AF]" />
              <span>{user.department}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-[#374151]">
            <Calendar className="h-4 w-4 text-[#9CA3AF]" />
            <span>Créé le {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: fr })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#374151]">
            <Clock className="h-4 w-4 text-[#9CA3AF]" />
            <span>
              Dernière connexion :{' '}
              {user.lastLogin
                ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true, locale: fr })
                : 'Jamais'}
            </span>
          </div>
        </div>
      </FormCard>

      <FormCard title="Actions">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onEdit(user)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F4F6F9]"
          >
            <Pencil className="h-4 w-4" /> Modifier
          </button>
          <button
            type="button"
            onClick={() => onResetPassword(user)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F4F6F9]"
          >
            <KeyRound className="h-4 w-4" /> Réinitialiser le mot de passe
          </button>
          {!isSelf &&
            (user.isActive ? (
              <button
                type="button"
                onClick={() => onDeactivate(user)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <PowerOff className="h-4 w-4" /> Désactiver
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onReactivate(user)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
              >
                <Power className="h-4 w-4" /> Réactiver
              </button>
            ))}
        </div>
      </FormCard>

      <FormCard title="Activité récente">
        {auditLogs.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">Aucune activité enregistrée</p>
        ) : (
          <ul className="space-y-3">
            {auditLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F4F6F9]">
                  <Activity className="h-3 w-3 text-[#9CA3AF]" />
                </div>
                <div>
                  <p className="text-xs text-[#374151]">
                    {log.action} — {log.entity}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormCard>
    </Modal>
  );
};
