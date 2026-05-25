import React, { useState } from 'react';
import { Shield, Loader2, ChevronLeft, ChevronRight, Search, Eye, Filter } from 'lucide-react';
import { useAuditLogs } from '../hooks/useAudit';
import type { AuditLogFilters, AuditLog } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const AuditLogsPage: React.FC = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 50 });
  const { data, isLoading } = useAuditLogs(filters);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const logs: AuditLog[] = data?.data || [];
  const pagination = data?.pagination;

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd/MM/yyyy HH:mm:ss', { locale: fr }); } catch { return d; }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="audit-logs-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Journaux d'audit</h1>
            <p className="text-sm text-slate-400">Historique des actions de sécurité et modifications</p>
          </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Rechercher par utilisateur, email..."
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            onChange={(e) => setFilters(f => ({ ...f, module: e.target.value || undefined, page: 1 }))}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Tous les modules</option>
            <option value="leave_request">Congés</option>
            <option value="absence">Absences</option>
            <option value="time_entry">Temps</option>
            <option value="employee">Employés</option>
            <option value="task">Tâches</option>
            <option value="work_schedule">Horaires</option>
            <option value="public_holiday">Jours fériés</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun log d'audit trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Module</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{log.userName}</p>
                      <p className="text-[10px] text-slate-400">{log.userEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.action.includes('delete') ? 'bg-rose-50 text-rose-600' :
                        log.action.includes('create') ? 'bg-emerald-50 text-emerald-600' :
                        'bg-sky-50 text-sky-600'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium uppercase tracking-wider">{log.module}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className={`p-1.5 rounded-lg transition-all ${expandedId === log.id ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="bg-slate-900 border-t border-slate-800">
                      <td colSpan={5} className="px-6 py-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ancienne Valeur</p>
                            <pre className="text-[11px] text-rose-400 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-auto max-h-60">
                              {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : 'null'}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Nouvelle Valeur</p>
                            <pre className="text-[11px] text-emerald-400 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-auto max-h-60">
                              {log.newValue ? JSON.stringify(log.newValue, null, 2) : 'null'}
                            </pre>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-4 text-[10px] text-slate-500">
                          <p><span className="font-bold text-slate-400">IP:</span> {log.ipAddress || 'Unknown'}</p>
                          <p className="truncate"><span className="font-bold text-slate-400">Agent:</span> {log.userAgent || 'Unknown'}</p>
                          <p><span className="font-bold text-slate-400">Entity ID:</span> {log.entityId || 'N/A'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
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