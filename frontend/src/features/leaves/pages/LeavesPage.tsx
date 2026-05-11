import React, { useState } from 'react';
import { CalendarDays, Plus, Check, X, Ban, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useLeaveRequests, useLeaveTypes, useApproveLeave, useRejectLeave, useCancelLeave } from '../hooks/useLeaves';
import { useNavigate } from 'react-router-dom';
import type { LeaveFilters, LeaveRequest } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700' },
  approved:  { label: 'Approuvé',   bg: 'bg-emerald-50', text: 'text-emerald-700' },
  rejected:  { label: 'Refusé',     bg: 'bg-rose-50', text: 'text-rose-700' },
  cancelled: { label: 'Annulé',     bg: 'bg-slate-100', text: 'text-slate-500' },
};

export const LeavesPage: React.FC = () => {
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.role);
  const canApprove = role === 'super_admin' || role === 'hr_agent' || role === 'manager';
  const canCreate = true; // all authenticated users

  const [filters, setFilters] = useState<LeaveFilters>({ page: 1, limit: 20 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data, isLoading } = useLeaveRequests({ ...filters, status: statusFilter || undefined });
  const { data: leaveTypes } = useLeaveTypes();
  const approveMut = useApproveLeave();
  const rejectMut = useRejectLeave();
  const cancelMut = useCancelLeave();

  const requests: LeaveRequest[] = data?.data || [];
  const pagination = data?.pagination;

  const handleApprove = (id: string) => {
    approveMut.mutate({ id, note: reviewNote }, { onSuccess: () => { setReviewingId(null); setReviewNote(''); } });
  };
  const handleReject = (id: string) => {
    rejectMut.mutate({ id, note: reviewNote }, { onSuccess: () => { setReviewingId(null); setReviewNote(''); } });
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d; }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="leaves-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Demandes de congés</h1>
            {pagination && <p className="text-sm text-slate-400">{pagination.total} demande{pagination.total !== 1 ? 's' : ''}</p>}
          </div>
        </div>
        {canCreate && (
          <button onClick={() => navigate('/leaves/request')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/20 hover:bg-violet-600 hover:-translate-y-0.5 active:translate-y-0"
            id="new-leave-btn">
            <Plus className="w-4 h-4" /> Nouvelle demande
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {['', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setFilters((f) => ({ ...f, page: 1 })); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s
              ? 'bg-violet-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            {s === '' ? 'Tous' : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune demande de congé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employé</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Période</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Jours</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                {canApprove && <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.map((req) => {
                const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                const isReviewing = reviewingId === req.id;
                return (
                  <React.Fragment key={req.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-sm">{req.employeeName || 'N/A'}</p>
                        <p className="text-xs text-slate-400">{req.department}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{req.leaveTypeName || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(req.startDate)} → {formatDate(req.endDate)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 text-violet-700 text-sm font-bold">
                          {req.workingDays ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                          {sc.label}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="px-6 py-4 text-center">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => handleApprove(req.id)} disabled={approveMut.isPending}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Approuver">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setReviewingId(isReviewing ? null : req.id)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors" title="Refuser">
                                <X className="w-4 h-4" />
                              </button>
                              <button onClick={() => cancelMut.mutate(req.id)} disabled={cancelMut.isPending}
                                className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors" title="Annuler">
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                    {isReviewing && (
                      <tr>
                        <td colSpan={canApprove ? 6 : 5} className="px-6 py-3 bg-rose-50/50">
                          <div className="flex items-center gap-3">
                            <input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="Motif du refus (optionnel)..."
                              className="flex-1 px-3 py-2 rounded-lg border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                            <button onClick={() => handleReject(req.id)} disabled={rejectMut.isPending}
                              className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
                              Confirmer le refus
                            </button>
                            <button onClick={() => { setReviewingId(null); setReviewNote(''); }}
                              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">Annuler</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
