import React, { useState } from 'react';
import { UserX, Plus, FileCheck, FileX, Info, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useAbsences, useMarkUnjustified, useDeleteAbsence, useCreateAbsence } from '../hooks/useAbsences';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { useNavigate } from 'react-router-dom';
import type { AbsenceFilters, Absence, CreateAbsenceInput } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700' },
  justified: { label: 'Justifiée', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  unjustified: { label: 'Non justifiée', bg: 'bg-rose-50', text: 'text-rose-700' },
};

export const AbsencesPage: React.FC = () => {
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.role);
  const canManage = role === 'super_admin' || role === 'hr_agent';

  const [filters, setFilters] = useState<AbsenceFilters>({ page: 1, limit: 20 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAbsence, setNewAbsence] = useState<Partial<CreateAbsenceInput>>({});

  const { data, isLoading } = useAbsences({ ...filters, justificationStatus: statusFilter || undefined });
  const { data: employeesData } = useEmployees({ limit: 100 });
  
  const createMut = useCreateAbsence();
  const deleteMut = useDeleteAbsence();
  const markUnjustifiedMut = useMarkUnjustified();

  const absences: Absence[] = data?.data || [];
  const pagination = data?.pagination;

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d; }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(newAbsence as CreateAbsenceInput, {
      onSuccess: () => {
        setIsModalOpen(false);
        setNewAbsence({});
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="absences-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <UserX className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestion des absences</h1>
            {pagination && <p className="text-sm text-slate-400">{pagination.total} absence{pagination.total !== 1 ? 's' : ''} au total</p>}
          </div>
        </div>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-rose-500/20 hover:bg-rose-600 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" /> Signaler une absence
          </button>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Signaler une absence</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Employé</label>
                <select 
                  required
                  value={newAbsence.employeeId || ''}
                  onChange={(e) => setNewAbsence({ ...newAbsence, employeeId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                >
                  <option value="">Sélectionner un employé...</option>
                  {(employeesData?.data || []).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Date de début</label>
                  <input 
                    type="date"
                    required
                    value={newAbsence.startDate || ''}
                    onChange={(e) => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Date de fin</label>
                  <input 
                    type="date"
                    required
                    value={newAbsence.endDate || ''}
                    onChange={(e) => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Type d'absence</label>
                <select 
                  value={newAbsence.type || ''}
                  onChange={(e) => setNewAbsence({ ...newAbsence, type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                >
                  <option value="">Sélectionner un type...</option>
                  <option value="Maladie">Maladie</option>
                  <option value="Injustifiée">Injustifiée</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Motif / Commentaire</label>
                <textarea 
                  value={newAbsence.reason || ''}
                  onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={createMut.isPending}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-100 flex items-center justify-center gap-2"
                >
                  {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer l'absence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {['', 'pending', 'justified', 'unjustified'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setFilters((f) => ({ ...f, page: 1 })); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s
              ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            {s === '' ? 'Toutes' : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
          </div>
        ) : absences.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <UserX className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune absence enregistrée</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employé</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Période</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type / Motif</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {absences.map((abs) => {
                const sc = STATUS_CONFIG[abs.justificationStatus] || STATUS_CONFIG.pending;
                return (
                  <tr key={abs.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 text-sm">{abs.employeeName || 'N/A'}</p>
                      <p className="text-xs text-slate-400">{abs.department}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(abs.startDate)} {abs.startDate !== abs.endDate && `→ ${formatDate(abs.endDate)}`}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{abs.type || 'Non spécifié'}</p>
                      <p className="text-xs text-slate-400 truncate max-w-xs">{abs.reason || 'Aucun motif'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => navigate(`/absences/${abs.id}`)}
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors" title="Détails">
                          <Info className="w-4 h-4" />
                        </button>
                        {canManage && abs.justificationStatus === 'pending' && (
                          <>
                            <button 
                              onClick={() => navigate(`/absences/${abs.id}`)} 
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Justifier">
                              <FileCheck className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => markUnjustifiedMut.mutate(abs.id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors" title="Marquer non justifiée">
                              <FileX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-400">Page {pagination.page} sur {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
