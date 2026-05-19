import React, { useState } from 'react';
import { Clock, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { useTimeEntries, useTimeSummary, useClockIn, useClockOut } from '../hooks/useTime';
import type { TimeEntry } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export const EmployeeTimePage: React.FC = () => {
  const [filters] = useState({
    page: 1,
    limit: 20,
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { data, isLoading } = useTimeEntries(filters);
  const { data: summary } = useTimeSummary({ startDate: filters.startDate, endDate: filters.endDate });
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const entries: TimeEntry[] = data?.data || [];

  const formatDate = (dateString: string) => {
    try { return format(new Date(dateString), 'dd MMM yyyy', { locale: fr }); } catch { return dateString; }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="employee-time-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mon pointage</h1>
            <p className="text-sm text-slate-400">Gérez vos heures d'arrivée et de sortie</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => clockInMutation.mutate()}
            disabled={clockInMutation.isLoading || clockOutMutation.isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            <ArrowUpRight className="w-4 h-4" />
            Pointer entrée
          </button>
          <button
            type="button"
            onClick={() => clockOutMutation.mutate()}
            disabled={clockInMutation.isLoading || clockOutMutation.isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <ArrowDownRight className="w-4 h-4" />
            Pointer sortie
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400">Heures travaillées</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{summary.totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400">Heures prévues</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{summary.expectedHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400">Heures sup.</p>
            <p className="mt-2 text-2xl font-black text-emerald-600">+{summary.overtime.toFixed(1)}h</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400">Taux présence</p>
            <p className="mt-2 text-2xl font-black text-sky-600">{(summary.attendanceRate * 100).toFixed(0)}%</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-sky-400 animate-spin" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun pointage enregistré pour ce mois</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Entrée</th>
                <th className="px-6 py-3">Sortie</th>
                <th className="px-6 py-3">Réelles</th>
                <th className="px-6 py-3">Prévues</th>
                <th className="px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-700">{formatDate(entry.date)}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-700">{entry.clockIn || '--:--'}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-700">{entry.clockOut || '--:--'}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{entry.totalHours?.toFixed(1) || '0.0'}h</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{entry.expectedHours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-sm">
                    {entry.overtime > 0 ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">Overtime</span>
                    ) : entry.deficit > 0 ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-600">Déficit</span>
                    ) : (
                      <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-600">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
