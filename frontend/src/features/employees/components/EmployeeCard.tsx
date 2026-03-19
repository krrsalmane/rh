import React from 'react';
import { Mail, Phone, Calendar, Briefcase, Pencil, Trash2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import type { Employee } from '../types';

interface Props {
  employee: Employee;
  onEdit: () => void;
  onDelete: () => void;
}

const contractLabels: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', internship: 'Stage', freelance: 'Freelance',
};
const contractColors: Record<string, string> = {
  CDI: 'bg-blue-50 text-blue-700 border-blue-200',
  CDD: 'bg-amber-50 text-amber-700 border-amber-200',
  internship: 'bg-purple-50 text-purple-700 border-purple-200',
  freelance: 'bg-slate-100 text-slate-600 border-slate-200',
};
const statusLabels: Record<string, string> = {
  active: 'Actif', inactive: 'Inactif', terminated: 'Résilié',
};
const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  terminated: 'bg-rose-50 text-rose-700 border-rose-200',
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return '—'; }
}

function formatSalary(salary?: number) {
  if (!salary) return '—';
  return salary.toLocaleString('fr-FR') + ' MAD';
}

export const EmployeeCard: React.FC<Props> = ({ employee, onEdit, onDelete }) => {
  const userRole = useAppSelector((s) => s.auth.role);
  const isSuperAdmin = userRole === 'super_admin';
  const canEdit = userRole === 'super_admin' || userRole === 'hr_agent';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6" id="employee-card">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-xl font-bold">
            {getInitials(employee.firstName, employee.lastName)}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {employee.firstName} {employee.lastName}
              </h1>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                {employee.function && (
                  <span className="text-sm text-slate-500">{employee.function}</span>
                )}
                {employee.function && employee.department && (
                  <span className="text-slate-300">•</span>
                )}
                {employee.department && (
                  <span className="text-sm text-slate-500">{employee.department}</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  id="employee-card-edit"
                >
                  <Pencil className="w-4 h-4" />
                  Modifier
                </button>
              )}
              {isSuperAdmin && (
                <button
                  onClick={onDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                  id="employee-card-delete"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${contractColors[employee.contractType]}`}>
              {contractLabels[employee.contractType]}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[employee.status]}`}>
              {statusLabels[employee.status]}
            </span>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            <div className="flex items-center gap-2.5 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-slate-400 text-xs">Date d'embauche</p>
                <p className="text-slate-700 font-medium">{formatDate(employee.hireDate)}</p>
              </div>
            </div>

            {employee.email && (
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-400 text-xs">Email</p>
                  <a href={`mailto:${employee.email}`} className="text-sky-600 hover:underline truncate block font-medium">
                    {employee.email}
                  </a>
                </div>
              </div>
            )}

            {employee.phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Téléphone</p>
                  <a href={`tel:${employee.phone}`} className="text-sky-600 hover:underline font-medium">
                    {employee.phone}
                  </a>
                </div>
              </div>
            )}

            {isSuperAdmin && (
              <div className="flex items-center gap-2.5 text-sm">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Salaire</p>
                  <p className="text-slate-700 font-semibold">{formatSalary(employee.salary)}</p>
                </div>
              </div>
            )}

            {employee.cin && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-4 h-4 text-slate-400 shrink-0 flex items-center justify-center text-xs font-bold">ID</div>
                <div>
                  <p className="text-slate-400 text-xs">CIN</p>
                  <p className="text-slate-700 font-medium">{employee.cin}</p>
                </div>
              </div>
            )}

            {employee.workScheduleName && (
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Planning</p>
                  <p className="text-slate-700 font-medium">{employee.workScheduleName}{employee.weeklyHours ? ` (${employee.weeklyHours}h/sem)` : ''}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
