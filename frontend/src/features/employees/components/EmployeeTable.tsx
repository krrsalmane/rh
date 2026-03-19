import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import type { Employee, EmployeeFilters } from '../types';

interface Props {
  employees: Employee[];
  isLoading: boolean;
  pagination?: { total: number; page: number; limit: number; totalPages: number };
  filters: EmployeeFilters;
  onFiltersChange: (filters: EmployeeFilters) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

type SortKey = 'firstName' | 'department' | 'function' | 'contractType' | 'status' | 'hireDate' | 'salary';

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
const statusDotColors: Record<string, string> = {
  active: 'bg-emerald-500', inactive: 'bg-slate-400', terminated: 'bg-rose-500',
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

function formatSalary(salary?: number) {
  if (!salary) return '—';
  return salary.toLocaleString('fr-FR') + ' MAD';
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export const EmployeeTable: React.FC<Props> = ({
  employees, isLoading, pagination, filters, onFiltersChange, onEdit, onDelete,
}) => {
  const navigate = useNavigate();
  const userRole = useAppSelector((s) => s.auth.role);
  const isSuperAdmin = userRole === 'super_admin';
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...employees].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    const cmp = String(aVal).localeCompare(String(bVal), 'fr');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`w-3 h-3 -mb-1 ${sortKey === col && sortDir === 'asc' ? 'text-sky-500' : 'text-slate-300'}`} />
      <ChevronDown className={`w-3 h-3 ${sortKey === col && sortDir === 'desc' ? 'text-sky-500' : 'text-slate-300'}`} />
    </span>
  );

  // Skeleton loader
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Employé', 'Département', 'Fonction', 'Contrat', 'Statut', 'Date embauche', ...(isSuperAdmin ? ['Salaire'] : []), 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {Array.from({ length: isSuperAdmin ? 8 : 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: j === 0 ? '180px' : '80px' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (employees.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucun employé trouvé</h3>
        <p className="text-sm text-slate-400">Essayez de modifier vos filtres ou ajoutez un nouvel employé.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" id="employees-table">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('firstName')}>
                Employé <SortIcon col="firstName" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('department')}>
                Département <SortIcon col="department" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('function')}>
                Fonction <SortIcon col="function" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('contractType')}>
                Contrat <SortIcon col="contractType" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('status')}>
                Statut <SortIcon col="status" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('hireDate')}>
                Date embauche <SortIcon col="hireDate" />
              </th>
              {isSuperAdmin && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('salary')}>
                  Salaire <SortIcon col="salary" />
                </th>
              )}
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/employees/${emp.id}`)}
                id={`employee-row-${emp.id}`}
              >
                {/* Employee name + email */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-semibold shrink-0">
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{emp.firstName} {emp.lastName}</p>
                      {emp.email && <p className="text-xs text-slate-400 truncate">{emp.email}</p>}
                    </div>
                  </div>
                </td>
                {/* Department */}
                <td className="px-4 py-3 text-sm text-slate-600">{emp.department || '—'}</td>
                {/* Function */}
                <td className="px-4 py-3 text-sm text-slate-600">{emp.function || '—'}</td>
                {/* Contract Badge */}
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${contractColors[emp.contractType]}`}>
                    {contractLabels[emp.contractType]}
                  </span>
                </td>
                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusDotColors[emp.status]}`} />
                    <span className="text-sm text-slate-600">{statusLabels[emp.status]}</span>
                  </div>
                </td>
                {/* Hire date */}
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(emp.hireDate)}</td>
                {/* Salary */}
                {isSuperAdmin && (
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">{formatSalary(emp.salary)}</td>
                )}
                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Voir"
                      id={`employee-view-${emp.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(emp)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Modifier"
                      id={`employee-edit-${emp.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => onDelete(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Supprimer"
                        id={`employee-delete-${emp.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Affichage de {(pagination.page - 1) * pagination.limit + 1} à{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} employés
          </p>
          <div className="flex items-center gap-2">
            <select
              value={filters.limit}
              onChange={(e) => onFiltersChange({ ...filters, limit: Number(e.target.value), page: 1 })}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600"
              id="employee-per-page"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-2 py-1 text-slate-400">…</span>
                    )}
                    <button
                      onClick={() => onFiltersChange({ ...filters, page: p })}
                      className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === pagination.page
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      id={`employee-page-${p}`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
