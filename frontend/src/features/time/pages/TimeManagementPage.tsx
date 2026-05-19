import React, { useState } from 'react';
import { Clock, Loader2, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useTimeEntries, useTimeSummary, useExportTimeReport, useUpdateTimeEntry, useCreateTimeEntry, useGenerateDefaultTimeEntries } from '../hooks/useTime';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
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

  const exportMut = useExportTimeReport();
  const updateMut = useUpdateTimeEntry();
  const createMut = useCreateTimeEntry();
  const generateMut = useGenerateDefaultTimeEntries();
  const { data: employeesData } = useEmployees({ limit: 100 });

  const handleGenerateDefaults = async () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    if (window.confirm(`Générer les pointages par défaut pour tous les employés pour la date du ${dateStr} ?`)) {
      try {
        await generateMut.mutateAsync(dateStr);
      } catch {
        // handled by hook
      }
    }
  };
  const { data, isLoading } = useTimeEntries(filters);
  const { data: summary } = useTimeSummary({ startDate: filters.startDate, endDate: filters.endDate });

  const entries: TimeEntry[] = data?.data || [];
  const pagination = data?.pagination;

  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({ clockIn: '', clockOut: '', lunchOut: '', lunchIn: '', reason: '' });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    employeeId: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    clockIn: '', 
    clockOut: '', 
    lunchOut: '', 
    lunchIn: '', 
    reason: '' 
  });

  const handleCreateSave = async () => {
    try {
      await createMut.mutateAsync({
        employeeId: createForm.employeeId,
        date: createForm.date,
        lunchOut: createForm.lunchOut || undefined,
        lunchIn: createForm.lunchIn || undefined,
        clockIn: createForm.clockIn || undefined,
        clockOut: createForm.clockOut || undefined,
        reason: createForm.reason || undefined,
        source: 'manual'
      });
      setIsCreateOpen(false);
      setCreateForm({ employeeId: '', date: format(new Date(), 'yyyy-MM-dd'), clockIn: '', clockOut: '', reason: '' });
    } catch {
      // handled by hook
    }
  };

  const handleEditClick = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditForm({
      clockIn: entry.clockIn || '',
      clockOut: entry.clockOut || '',
      lunchOut: entry.lunchOut || '',
      lunchIn: entry.lunchIn || '',
      reason: ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    try {
      await updateMut.mutateAsync({
        id: editingEntry.id,
        data: {
          clockIn: editForm.clockIn || undefined,
          clockOut: editForm.clockOut || undefined,
          lunchOut: editForm.lunchOut || undefined,
          lunchIn: editForm.lunchIn || undefined,
          reason: editForm.reason
        }
      });
      setEditingEntry(null);
    } catch {
      // handled by hook
    }
  };

  const handleExport = async (formatType: 'csv' | 'pdf') => {
    try {
      const blob = await exportMut.mutateAsync({ 
        startDate: filters.startDate, 
        endDate: filters.endDate, 
        format: formatType 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `time-report-${filters.startDate}-${filters.endDate}.${formatType}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // error handled by hook
    }
  };

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
          {canManage && (
            <>
              <button
                type="button"
                onClick={handleGenerateDefaults}
                disabled={generateMut.isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-600 transition-all disabled:opacity-50"
              >
                {generateMut.isLoading ? 'Génération...' : 'Générer par défaut'}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-all"
              >
              Créer un pointage
            </button>
          </>
          )}
          <button
            type="button"
            disabled={exportMut.isLoading}
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exportMut.isLoading ? 'Export en cours...' : 'Export CSV'}
          </button>
          <button
            type="button"
            disabled={exportMut.isLoading}
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl font-medium text-sm hover:bg-sky-700 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exportMut.isLoading ? 'Export en cours...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Heures</p>
            <p className="text-2xl font-black text-slate-800">{summary.totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Heures prévues</p>
            <p className="text-2xl font-black text-slate-700">{summary.expectedHours.toFixed(1)}h</p>
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
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Déjeuner</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">H. Réelles</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">H. Prévues</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Solde</th>
                {canManage && <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.map((entry) => {
                let isLunchTooLong = false;
                if (entry.lunchOut && entry.lunchIn) {
                  const [oH, oM] = entry.lunchOut.split(':').map(Number);
                  const [iH, iM] = entry.lunchIn.split(':').map(Number);
                  const diff = (iH * 60 + iM) - (oH * 60 + oM);
                  isLunchTooLong = diff > 60; // Max 1h
                }
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 text-sm">{entry.employeeName}</p>
                      <p className="text-xs text-slate-400">{entry.department}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(entry.date)}</td>
                    <td className="px-6 py-4 text-center text-sm font-mono">{entry.clockIn || '--:--'}</td>
                    <td className="px-6 py-4 text-center text-sm font-mono">{entry.clockOut || '--:--'}</td>
                    <td className={`px-6 py-4 text-center text-sm font-mono ${isLunchTooLong ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                      {entry.lunchOut && entry.lunchIn ? `${entry.lunchOut} - ${entry.lunchIn}` : '--:--'}
                    </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">{Number(entry.totalHours || 0).toFixed(1)}h</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-400">{Number(entry.expectedHours || 0).toFixed(1)}h</td>
                  <td className="px-6 py-4 text-center">
                    {Number(entry.overtime || 0) > 0 && (
                      <span className="text-xs font-bold text-emerald-600">+{Number(entry.overtime || 0).toFixed(1)}h</span>
                    )}
                    {Number(entry.deficit || 0) > 0 && (
                      <span className="text-xs font-bold text-rose-600">-{Number(entry.deficit || 0).toFixed(1)}h</span>
                    )}
                    {entry.overtime === 0 && entry.deficit === 0 && (
                      <span className="text-xs text-slate-300">0.0h</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEditClick(entry)}
                        className="text-sky-600 hover:text-sky-700 text-sm font-semibold"
                      >
                        Modifier
                      </button>
                    </td>
                  )}
                </tr>
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

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Créer un pointage</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Employé <span className="text-red-500">*</span></label>
                <select
                  value={createForm.employeeId}
                  onChange={(e) => setCreateForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                  required
                >
                  <option value="">Sélectionner un employé</option>
                  {employeesData?.data?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Heure d'entrée</label>
                <input
                  type="time"
                  value={createForm.clockIn}
                  onChange={(e) => setCreateForm(f => ({ ...f, clockIn: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Heure de sortie</label>
                <input
                  type="time"
                  value={createForm.clockOut}
                  onChange={(e) => setCreateForm(f => ({ ...f, clockOut: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Sortie Déjeuner</label>
                <input
                  type="time"
                  value={createForm.lunchOut}
                  onChange={(e) => setCreateForm(f => ({ ...f, lunchOut: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Retour Déjeuner</label>
                <input
                  type="time"
                  value={createForm.lunchIn}
                  onChange={(e) => setCreateForm(f => ({ ...f, lunchIn: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Motif</label>
                <textarea
                  value={createForm.reason}
                  onChange={(e) => setCreateForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Ex: Oubli de pointage..."
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 h-24"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateSave}
                disabled={!createForm.employeeId || !createForm.date || createMut.isLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium disabled:opacity-50"
              >
                {createMut.isLoading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Modifier le pointage</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Heure d'entrée</label>
                <input
                  type="time"
                  value={editForm.clockIn}
                  onChange={(e) => setEditForm(f => ({ ...f, clockIn: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Heure de sortie</label>
                <input
                  type="time"
                  value={editForm.clockOut}
                  onChange={(e) => setEditForm(f => ({ ...f, clockOut: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Sortie Déjeuner</label>
                <input
                  type="time"
                  value={editForm.lunchOut}
                  onChange={(e) => setEditForm(f => ({ ...f, lunchOut: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Retour Déjeuner</label>
                <input
                  type="time"
                  value={editForm.lunchIn}
                  onChange={(e) => setEditForm(f => ({ ...f, lunchIn: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Motif de la modification</label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Ex: Oubli de pointage, correction erreur..."
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 h-24"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateMut.isLoading}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-medium disabled:opacity-50"
              >
                {updateMut.isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
