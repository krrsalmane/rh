import React, { useState } from 'react';
import { Clock, Loader2, ChevronLeft, ChevronRight, Filter, Download, Edit3, Trash2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useTimeEntries, useTimeSummary, useExportTimeReport, useUpdateTimeEntry, useCreateTimeEntry, useRecordTimeAction, useDeleteTimeEntry } from '../hooks/useTime';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import type { TimeEntryFilters, TimeEntry } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TimeManagementPage: React.FC = () => {
  const role = useAppSelector((s) => s.auth.role);
  const canManage = role === 'super_admin' || role === 'hr_agent' || role === 'manager';

  const [filters, setFilters] = useState<TimeEntryFilters>({ 
    page: 1, 
    limit: 100,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const authEmployeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const effectiveAuthId = authEmployeeId || userId;
  const exportMut = useExportTimeReport();
  const updateMut = useUpdateTimeEntry();
  const createMut = useCreateTimeEntry();
  const recordMut = useRecordTimeAction();
  const deleteMut = useDeleteTimeEntry();
  const { data: employeesData } = useEmployees({ limit: 100 });

  const { data, isLoading } = useTimeEntries(filters);
  const { data: summary } = useTimeSummary({ startDate: filters.startDate, endDate: filters.endDate });

  const entries: TimeEntry[] = data?.data || [];
  const employeeList = role === 'employee'
    ? employeesData?.data?.filter((emp: any) => emp.id === effectiveAuthId) ?? []
    : employeesData?.data ?? [];
  const pagination = data?.pagination;

  const [selectedEmployeeDetailsId, setSelectedEmployeeDetailsId] = useState<string | null>(null);
  const selectedEmployeeEntry = selectedEmployeeDetailsId
    ? entries.find((entry) => entry.employeeId === selectedEmployeeDetailsId && entry.date === filters.startDate)
    : null;

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
      setCreateForm({
        employeeId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        clockIn: '',
        clockOut: '',
        lunchOut: '',
        lunchIn: '',
        reason: '',
      });
    } catch {
      // handled by hook
    }
  };

  const handleEditClick = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditForm({
      clockIn: formatTimeValue(entry.clockIn),
      clockOut: formatTimeValue(entry.clockOut),
      lunchOut: formatTimeValue(entry.lunchOut),
      lunchIn: formatTimeValue(entry.lunchIn),
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

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeValue = (time?: string | null) => {
    if (!time) return '';
    const trimmed = time.trim();
    return trimmed.length >= 5 ? trimmed.slice(0, 5) : trimmed;
  };

  const handleTimeAction = async (employeeId: string, action: 'morning-in' | 'morning-out' | 'lunch-out' | 'lunch-in' | 'prayer-out' | 'prayer-in') => {
    if (!employeeId) {
      window.alert('Employé invalide');
      return;
    }

    const timeValue = getCurrentTime();
    try {
      await recordMut.mutateAsync({ 
        action, 
        time: timeValue, 
        employeeId, 
        date: filters.startDate 
      });
      
      // Force refresh of details if this employee was being viewed
      if (selectedEmployeeDetailsId === employeeId) {
        setSelectedEmployeeDetailsId(null);
        setTimeout(() => setSelectedEmployeeDetailsId(employeeId), 100);
      }
    } catch {
      // handled by hooks
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
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
        <div className="flex gap-2">
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
          {canManage && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-all"
            >
              Ajouter pointage
            </button>
          )}
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
          <label className="text-xs text-slate-400 font-bold uppercase">Date de Pointage</label>
          <input 
            type="date" 
            value={filters.startDate} 
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value, endDate: e.target.value, page: 1 }))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          </div>
        ) : employeeList.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun employé trouvé pour cette période</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
              {employeeList.map((emp: any) => {
                const rowEntry = entries.find((entry) => entry.employeeId === emp.id && entry.date === filters.startDate);
                const isSelected = emp.id === selectedEmployeeDetailsId;
                
                const canPerform = (action: string) => {
                  if (!rowEntry) return action === 'morning-in';
                  switch (action) {
                    case 'morning-in':
                      return !rowEntry.clockIn;
                    case 'morning-out':
                      return !!rowEntry.clockIn || !!rowEntry.lunchIn;
                    case 'lunch-out':
                      return !!rowEntry.clockIn || !!rowEntry.lunchIn;
                    case 'lunch-in':
                      return !!rowEntry.lunchOut;
                    case 'prayer-out':
                      return !!rowEntry.clockIn;
                    case 'prayer-in':
                      return rowEntry.reason === 'Prayer clock out';
                    default:
                      return false;
                  }
                };

                // Helper to check if an action has been recorded in the rowEntry
                const isRecorded = (action: string) => {
                  if (!rowEntry) return false;
                  switch (action) {
                    case 'morning-in': return !!rowEntry.clockIn && rowEntry.reason === 'Morning clock in';
                    case 'morning-out': return !!rowEntry.clockOut && rowEntry.reason === 'Morning clock out';
                    case 'lunch-out': return !!rowEntry.lunchOut;
                    case 'lunch-in': return !!rowEntry.lunchIn;
                    case 'prayer-out': return !!rowEntry.clockOut && rowEntry.reason === 'Prayer clock out';
                    case 'prayer-in': return !!rowEntry.clockIn && rowEntry.reason === 'Prayer clock in';
                    default: return false;
                  }
                };

                return (
                  <div
                    key={emp.id}
                    className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 ${isSelected ? 'bg-slate-50' : ''}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{emp.firstName} {emp.lastName}</p>
                      {emp.department && <p className="text-xs text-slate-400">{emp.department}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-start sm:justify-end items-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'morning-in'); }}
                        disabled={!canPerform('morning-in')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${isRecorded('morning-in') ? 'bg-emerald-800' : 'bg-emerald-600 hover:bg-emerald-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Morning Clock In
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'morning-out'); }}
                        disabled={!canPerform('morning-out')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${isRecorded('morning-out') ? 'bg-slate-800' : 'bg-slate-600 hover:bg-slate-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Leave
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'lunch-out'); }}
                        disabled={!canPerform('lunch-out')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${isRecorded('lunch-out') ? 'bg-orange-800' : 'bg-orange-600 hover:bg-orange-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Lunch Clock Out
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'lunch-in'); }}
                        disabled={!canPerform('lunch-in')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${isRecorded('lunch-in') ? 'bg-lime-800' : 'bg-lime-600 hover:bg-lime-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Back from Lunch
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'prayer-out'); }}
                        disabled={!canPerform('prayer-out')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${isRecorded('prayer-out') ? 'bg-violet-800' : 'bg-violet-600 hover:bg-violet-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Prayer Clock Out
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'prayer-in'); }}
                        disabled={!canPerform('prayer-in')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${isRecorded('prayer-in') ? 'bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Back from Prayer
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployeeDetailsId((prev) => (prev === emp.id ? null : emp.id));
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-all"
                      >
                        Détails
                      </button>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (rowEntry) handleEditClick(rowEntry); }}
                            disabled={!rowEntry}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${rowEntry ? 'bg-slate-100 text-sky-600 hover:bg-slate-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} transition`}
                            aria-label="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (rowEntry) handleDeleteEntry(rowEntry.id); }}
                            disabled={!rowEntry}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${rowEntry ? 'bg-slate-100 text-rose-600 hover:bg-slate-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} transition`}
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {selectedEmployeeDetailsId && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-3">Time Entry Details</h2>
            {selectedEmployeeEntry ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Clock In</p>
                  <p className="font-medium">{formatTimeValue(selectedEmployeeEntry.clockIn) || '--:--'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Clock Out</p>
                  <p className="font-medium">{formatTimeValue(selectedEmployeeEntry.clockOut) || '--:--'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Lunch Out</p>
                  <p className="font-medium">{formatTimeValue(selectedEmployeeEntry.lunchOut) || '--:--'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Lunch In</p>
                  <p className="font-medium">{formatTimeValue(selectedEmployeeEntry.lunchIn) || '--:--'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No records for this date.</p>
            )}
          </div>
        )}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Ajouter un pointage</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Employé <span className="text-red-500">*</span></label>
                <select
                  value={createForm.employeeId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, employeeId: e.target.value }))}
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
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Heure d'entrée</label>
                <input
                  type="time"
                  value={createForm.clockIn}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, clockIn: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Heure de sortie</label>
                <input
                  type="time"
                  value={createForm.clockOut}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, clockOut: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Sortie Déjeuner</label>
                <input
                  type="time"
                  value={createForm.lunchOut}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lunchOut: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Retour Déjeuner</label>
                <input
                  type="time"
                  value={createForm.lunchIn}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lunchIn: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Motif</label>
                <textarea
                  value={createForm.reason}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, reason: e.target.value }))}
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
            <h2 className="text-xl font-bold mb-4">Edit Time Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Clock In</label>
                <input
                  type="time"
                  value={editForm.clockIn}
                  onChange={(e) => setEditForm(f => ({ ...f, clockIn: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Clock Out</label>
                <input
                  type="time"
                  value={editForm.clockOut}
                  onChange={(e) => setEditForm(f => ({ ...f, clockOut: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Lunch Out</label>
                <input
                  type="time"
                  value={editForm.lunchOut}
                  onChange={(e) => setEditForm(f => ({ ...f, lunchOut: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Lunch In</label>
                <input
                  type="time"
                  value={editForm.lunchIn}
                  onChange={(e) => setEditForm(f => ({ ...f, lunchIn: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Modification Reason</label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Ex: Forgot to clock in, correction..."
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 h-24"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateMut.isLoading}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-medium disabled:opacity-50"
              >
                {updateMut.isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
