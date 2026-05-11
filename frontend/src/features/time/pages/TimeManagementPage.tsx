import React, { useState } from 'react';
import { Clock, Loader2, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useTimeEntries, useTimeSummary } from '../hooks/useTime';
import type { TimeEntryFilters, TimeEntry } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TimeManagementPage: React.FC = () => {
  const role = useAppSelector((s) => s.auth.role);
  const canManage = role === 'super_admin' || role === 'hr_agent' || role === 'manager';

  const [filters, setFilters] = useState<TimeEntryFilters>({ 
    page: 1, 
    limit: 20,
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data, isLoading } = useTimeEntries(filters);
  const { data: summary } = useTimeSummary({ startDate: filters.startDate, endDate: filters.endDate });

  const entries: TimeEntry[] = data?.data || [];
  const pagination = data?.pagination;

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return d; }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="time-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestion du temps</h1>
            <p className="text-sm text-slate-400">Suivi des pointages et heures de travail</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Heures</p>
            <p className="text-2xl font-black text-slate-800">{summary.totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Heures Supp.</p>
            <p className="text-2xl font-black text-emerald-600">+{summary.overtime.toFixed(1)}h</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Déficit</p>
            <p className="text-2xl font-black text-rose-600">-{summary.deficit.toFixed(1)}h</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Taux Présence</p>
            <p className="text-2xl font-black text-sky-600">{(summary.attendanceRate * 100).toFixed(0)}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-semibold">Filtres :</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase">Début</label>
          <input 
            type="date" 
            value={filters.startDate} 
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value, page: 1 }))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase">Fin</label>
          <input 
            type="date" 
            value={filters.endDate} 
            onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value, page: 1 }))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun pointage trouvé pour cette période</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employé</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entrée</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sortie</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">H. Réelles</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">H. Prévues</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Solde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800 text-sm">{entry.employeeName}</p>
                    <p className="text-xs text-slate-400">{entry.department}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(entry.date)}</td>
                  <td className="px-6 py-4 text-center text-sm font-mono">{entry.clockIn || '--:--'}</td>
                  <td className="px-6 py-4 text-center text-sm font-mono">{entry.clockOut || '--:--'}</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">{entry.totalHours?.toFixed(1) || '0.0'}h</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">{entry.expectedHours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-center">
                    {entry.overtime > 0 && (
                      <span className="text-xs font-bold text-emerald-600">+{entry.overtime.toFixed(1)}h</span>
                    )}
                    {entry.deficit > 0 && (
                      <span className="text-xs font-bold text-rose-600">-{entry.deficit.toFixed(1)}h</span>
                    )}
                    {entry.overtime === 0 && entry.deficit === 0 && (
                      <span className="text-xs text-slate-300">0.0h</span>
                    )}
                  </td>
                </tr>
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
