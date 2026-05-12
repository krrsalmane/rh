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

  // Debug logging
  console.log('LeavesPage - Data:', data);
  console.log('LeavesPage - Requests:', requests);
  console.log('LeavesPage - Filters:', filters);
  console.log('LeavesPage - Status Filter:', statusFilter);

  // Apply status filtering to real data
  const displayRequests = statusFilter 
    ? requests.filter(req => req.status === statusFilter)
    : requests;

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
    <div className="space-y-4 sm:space-y-6 animate-fade-in-up" id="leaves-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Demandes de congés</h1>
            <p className="text-sm text-slate-400">{displayRequests.length} demande{displayRequests.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {canCreate && (
          <button onClick={() => navigate('/leaves/request')}
            className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 bg-violet-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/20 hover:bg-violet-600 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto justify-center"
            id="new-leave-btn">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nouvelle demande</span><span className="sm:hidden">Ajouter</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm">
        {['', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setFilters((f) => ({ ...f, page: 1 })); }}
            className={`px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${statusFilter === s
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
        ) : displayRequests.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune demande de congé</p>
          </div>
        ) : (
          <div className="block lg:hidden">
            {/* Mobile Card View */}
            <div className="divide-y divide-slate-100">
              {displayRequests.map((req) => {
                const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                const isReviewing = reviewingId === req.id;
                return (
                  <div key={req.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">{req.employeeName || 'N/A'}</h3>
                        <p className="text-xs text-slate-400">{req.department}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} flex-shrink-0`}>
                        {sc.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-400 text-xs">Type:</span>
                        <p className="text-slate-600">{req.leaveTypeName || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs">Jours:</span>
                        <p className="text-slate-600">{req.workingDays ?? '—'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-slate-400 text-xs">Période:</span>
                      <p className="text-slate-600 text-sm">{formatDate(req.startDate)} → {formatDate(req.endDate)}</p>
                    </div>
                    
                    {canApprove && req.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-2">
                        <button onClick={() => handleApprove(req.id)} disabled={approveMut.isPending}
                          className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" /> Approuver
                        </button>
                        <button onClick={() => setReviewingId(isReviewing ? null : req.id)}
                          className="flex-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors flex items-center justify-center gap-1">
                          <X className="w-4 h-4" /> Refuser
                        </button>
                        <button onClick={() => cancelMut.mutate(req.id)} disabled={cancelMut.isPending}
                          className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors" title="Annuler">
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    
                    {isReviewing && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Motif du refus (optionnel)..."
                          className="w-full px-3 py-2 rounded-lg border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                        <div className="flex gap-2">
                          <button onClick={() => handleReject(req.id)} disabled={rejectMut.isPending}
                            className="flex-1 px-3 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
                            Confirmer le refus
                          </button>
                          <button onClick={() => { setReviewingId(null); setReviewNote(''); }}
                            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg">
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Desktop Table View */}
        <div className="hidden lg:block">
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
              {displayRequests.map((req) => {
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
        </div>
      </div>
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
  );
};
