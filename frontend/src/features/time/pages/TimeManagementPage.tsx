import React, { useState } from 'react';
import { Clock, Loader2, ChevronLeft, ChevronRight, Filter, Download, Edit3, Trash2, CheckCircle } from 'lucide-react';
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

  const [statusFilter, setStatusFilter] = useState<'all' | 'arrive_late' | 'left_early' | 'late_lunch'>('all');

  const filteredEmployeeList = employeeList.filter((emp: any) => {
    if (statusFilter === 'all') return true;
    const entry = entries.find((e) => e.employeeId === emp.id && e.date === filters.startDate);
    if (!entry) return false;

    if (statusFilter === 'arrive_late') {
      return entry.clockIn && entry.clockIn > '09:00:00';
    }
    if (statusFilter === 'left_early') {
      return entry.clockOut && entry.clockOut < '18:00:00';
    }
    if (statusFilter === 'late_lunch') {
      if (!entry.lunchOut || !entry.lunchIn) return false;
      const [outH, outM] = entry.lunchOut.split(':').map(Number);
      const [inH, inM] = entry.lunchIn.split(':').map(Number);
      const diff = (inH * 60 + inM) - (outH * 60 + outM);
      return diff > 60;
    }
    return true;
  });

  const [selectedEmployeeDetailsId, setSelectedEmployeeDetailsId] = useState<string | null>(null);
  const selectedEmployeeEntry = selectedEmployeeDetailsId
    ? entries.find((entry) => entry.employeeId === selectedEmployeeDetailsId && entry.date === filters.startDate)
    : null;

  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({ clockIn: '', clockOut: '', lunchOut: '', lunchIn: '', prayerOut: '', prayerIn: '', prayer2Out: '', prayer2In: '', overtime: '', reason: '' });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const ALLOWED_PRAYER_BREAKS = 2; // Dynamic: will come from company settings
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    clockIn: '',
    clockOut: '',
    lunchOut: '',
    lunchIn: '',
    prayerBreaks: Array(ALLOWED_PRAYER_BREAKS).fill(null).map(() => ({ out: '', in: '' })),
    reason: ''
  });


  const handleCreateSave = async () => {
    try {
      // Find the first prayer break pair that has both values
      const filledPrayerBreak = createForm.prayerBreaks.find(pb => pb.out && pb.in);
      
      await createMut.mutateAsync({
        employeeId: createForm.employeeId,
        date: createForm.date,
        lunchOut: createForm.lunchOut || undefined,
        lunchIn: createForm.lunchIn || undefined,
        prayerOut: createForm.prayerBreaks[0]?.out || undefined,
        prayerIn: createForm.prayerBreaks[0]?.in || undefined,
        prayer2Out: createForm.prayerBreaks[1]?.out || undefined,
        prayer2In: createForm.prayerBreaks[1]?.in || undefined,
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
        prayerBreaks: Array(ALLOWED_PRAYER_BREAKS).fill(null).map(() => ({ out: '', in: '' })),
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
      prayerOut: formatTimeValue(entry.prayerOut),
      prayerIn: formatTimeValue(entry.prayerIn),
      prayer2Out: formatTimeValue(entry.prayer2Out),
      prayer2In: formatTimeValue(entry.prayer2In),
      overtime: entry.overtime !== undefined ? String(entry.overtime) : '',
      reason: ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    // Only send overtime if the user manually modified it in the form.
    // If they didn't touch it, send undefined so the backend recalculates it based on the new times.
    const originalOvertime = editingEntry.overtime !== undefined ? String(editingEntry.overtime) : '';
    const overtimeToSend = editForm.overtime !== originalOvertime 
      ? (editForm.overtime === '' ? 0 : Number(editForm.overtime)) 
      : undefined;

    try {
      await updateMut.mutateAsync({
        id: editingEntry.id,
        data: {
          clockIn: editForm.clockIn || undefined,
          clockOut: editForm.clockOut || undefined,
          lunchOut: editForm.lunchOut || undefined,
          lunchIn: editForm.lunchIn || undefined,
          prayerOut: editForm.prayerOut || undefined,
          prayerIn: editForm.prayerIn || undefined,
          prayer2Out: editForm.prayer2Out || undefined,
          prayer2In: editForm.prayer2In || undefined,
          overtime: overtimeToSend,
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



  const handleTimeAction = async (employeeId: string, action: 'morning-in' | 'morning-out' | 'lunch-out' | 'lunch-in' | 'prayer-out' | 'prayer-in' | 'prayer2-out' | 'prayer2-in') => {
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

  const formatOvertime = (decimalHours?: number | null) => {
    if (!decimalHours || decimalHours < 1) return '--';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `+${hours}h${minutes > 0 ? `${minutes}m` : ''}`;
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
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-bold uppercase">Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="all">Tous</option>
            <option value="arrive_late">Arrived Late </option>
            <option value="left_early">Left Early </option>
            <option value="late_lunch">Past Time Break</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          </div>
        ) : filteredEmployeeList.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun employé trouvé pour cette période</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEmployeeList.map((emp: any) => {
              const rowEntry = entries.find((entry) => entry.employeeId === emp.id && entry.date === filters.startDate);
              const isSelected = emp.id === selectedEmployeeDetailsId;

              const isRecorded = (action: string) => {
                if (!rowEntry) return false;
                switch (action) {
                  case 'morning-in': return !!rowEntry.clockIn;
                  case 'morning-out': return !!rowEntry.clockOut;
                  case 'lunch-out': return !!rowEntry.lunchOut;
                  case 'lunch-in': return !!rowEntry.lunchIn;
                  case 'prayer-out': return !!rowEntry.prayerOut;
                  case 'prayer-in': return !!rowEntry.prayerIn;
                  case 'prayer2-out': return !!rowEntry.prayer2Out;
                  case 'prayer2-in': return !!rowEntry.prayer2In;
                  default: return false;
                }
              };

              const canPerform = (action: string) => {
                if (!rowEntry) return action === 'morning-in';
                if (isRecorded(action)) return false;
                if (!rowEntry.clockIn) return false;

                switch (action) {
                  case 'morning-in': return false; // handled by isRecorded
                  case 'morning-out': return !rowEntry.clockOut;
                  case 'lunch-out': return !rowEntry.lunchOut && !rowEntry.clockOut;
                  case 'lunch-in': return !!rowEntry.lunchOut && !rowEntry.lunchIn && !rowEntry.clockOut;
                  case 'prayer-out': return !rowEntry.prayerOut && !rowEntry.clockOut;
                  case 'prayer-in': return !!rowEntry.prayerOut && !rowEntry.prayerIn && !rowEntry.clockOut;
                  case 'prayer2-out': return !!rowEntry.prayerIn && !rowEntry.prayer2Out && !rowEntry.clockOut;
                  case 'prayer2-in': return !!rowEntry.prayer2Out && !rowEntry.prayer2In && !rowEntry.clockOut;
                  default: return false;
                }
              };

              const canPerformPrayerOut = !!rowEntry?.clockIn && !rowEntry?.clockOut && (!rowEntry?.prayerOut || (!!rowEntry?.prayerIn && !rowEntry?.prayer2Out));
              const canPerformPrayerIn = !!rowEntry?.clockIn && !rowEntry?.clockOut && ((!!rowEntry?.prayerOut && !rowEntry?.prayerIn) || (!!rowEntry?.prayer2Out && !rowEntry?.prayer2In));
              const isAllPrayerOutRecorded = !!rowEntry?.prayer2Out; 
              const isAllPrayerInRecorded = !!rowEntry?.prayer2In;

              return (
                <div key={emp.id} className="flex flex-col border-b border-slate-100 last:border-0">
                  <div
                    className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 transition-colors ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
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
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-[13px] transition-all border ${isRecorded('morning-in') ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default' : canPerform('morning-in') ? 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'}`}
                      >
                        {isRecorded('morning-in') && <CheckCircle className="w-3.5 h-3.5" />} Entrée
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'morning-out'); }}
                        disabled={!canPerform('morning-out')}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-[13px] transition-all border ${isRecorded('morning-out') ? 'bg-slate-100 border-slate-300 text-slate-700 cursor-default' : canPerform('morning-out') ? 'bg-slate-700 border-slate-800 text-white hover:bg-slate-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'}`}
                      >
                        {isRecorded('morning-out') && <CheckCircle className="w-3.5 h-3.5" />} Sortie
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'lunch-out'); }}
                        disabled={!canPerform('lunch-out')}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-[13px] transition-all border ${isRecorded('lunch-out') ? 'bg-amber-50 border-amber-200 text-amber-600 cursor-default' : canPerform('lunch-out') ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'}`}
                      >
                        {isRecorded('lunch-out') && <CheckCircle className="w-3.5 h-3.5" />} Départ Déj.
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'lunch-in'); }}
                        disabled={!canPerform('lunch-in')}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-[13px] transition-all border ${isRecorded('lunch-in') ? 'bg-sky-50 border-sky-200 text-sky-600 cursor-default' : canPerform('lunch-in') ? 'bg-sky-500 border-sky-600 text-white hover:bg-sky-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'}`}
                      >
                        {isRecorded('lunch-in') && <CheckCircle className="w-3.5 h-3.5" />} Retour Déj.
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, !rowEntry?.prayerOut ? 'prayer-out' : 'prayer2-out'); }}
                        disabled={!canPerformPrayerOut}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-[13px] transition-all border ${isAllPrayerOutRecorded ? 'bg-violet-50 border-violet-200 text-violet-600 cursor-default' : canPerformPrayerOut ? 'bg-violet-500 border-violet-600 text-white hover:bg-violet-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'}`}
                      >
                        {isAllPrayerOutRecorded && <CheckCircle className="w-3.5 h-3.5" />} Départ Prière
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, (rowEntry?.prayerOut && !rowEntry?.prayerIn) ? 'prayer-in' : 'prayer2-in'); }}
                        disabled={!canPerformPrayerIn}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-[13px] transition-all border ${isAllPrayerInRecorded ? 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600 cursor-default' : canPerformPrayerIn ? 'bg-fuchsia-500 border-fuchsia-600 text-white hover:bg-fuchsia-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'}`}
                      >
                        {isAllPrayerInRecorded && <CheckCircle className="w-3.5 h-3.5" />} Retour Prière
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
                  {isSelected && (
                    <div className="bg-slate-50/50 border-t border-slate-100 p-6 px-8 shadow-inner">
                      <h2 className="text-sm font-semibold mb-4 text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-500" />
                        Détails du pointage
                      </h2>
                      {rowEntry ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Entrée</p>
                            <p className="font-mono text-lg font-medium text-slate-800">{formatTimeValue(rowEntry.clockIn) || '--:--'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sortie Déj.</p>
                            <p className="font-mono text-lg font-medium text-slate-800">{formatTimeValue(rowEntry.lunchOut) || '--:--'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Retour Déj.</p>
                            <p className="font-mono text-lg font-medium text-slate-800">{formatTimeValue(rowEntry.lunchIn) || '--:--'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Départ Prière 1</p>
                            <p className="font-mono text-lg font-medium text-slate-800">{formatTimeValue(rowEntry.prayerOut) || '--:--'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Retour Prière 1</p>
                            <p className="font-mono text-lg font-medium text-slate-800">{formatTimeValue(rowEntry.prayerIn) || '--:--'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Départ Prière 2</p>
                            <p className="font-mono text-lg font-medium text-slate-800">{formatTimeValue(rowEntry.prayer2Out) || '--:--'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Retour Prière 2</p>
                            <p className="font-mono text-lg font-medium text-slate-800">{formatTimeValue(rowEntry.prayer2In) || '--:--'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sortie</p>
                            <p className="font-mono text-lg font-medium text-slate-800">{formatTimeValue(rowEntry.clockOut) || '--:--'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Heures Sup.</p>
                            <p className="font-mono text-lg font-medium text-emerald-600">
                              {formatOvertime(rowEntry.overtime)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                          <Clock className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-sm">Aucun enregistrement pour cette date.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
                <label className="text-sm font-medium text-slate-600">Heure d'entrée (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="09:00"
                  value={createForm.clockIn}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setCreateForm((prev) => ({ ...prev, clockIn: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Heure de sortie (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="18:00"
                  value={createForm.clockOut}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setCreateForm((prev) => ({ ...prev, clockOut: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Sortie Déjeuner (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="12:00"
                  value={createForm.lunchOut}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setCreateForm((prev) => ({ ...prev, lunchOut: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Retour Déjeuner (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="13:00"
                  value={createForm.lunchIn}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setCreateForm((prev) => ({ ...prev, lunchIn: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>

              {/* Multiple Prayer Breaks */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-slate-700">📿 Pauses de Prière</label>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">{ALLOWED_PRAYER_BREAKS} autorisées</span>
                </div>
                
                {createForm.prayerBreaks.map((prayerBreak, idx) => (
                  <div key={idx} className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-bold text-blue-900 mb-3">Prière #{idx + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600">Départ (HH:MM)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                          placeholder="15:00"
                          value={prayerBreak.out}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                              setCreateForm(prev => {
                                const newBreaks = [...prev.prayerBreaks];
                                newBreaks[idx].out = val;
                                return { ...prev, prayerBreaks: newBreaks };
                              });
                            }
                          }}
                          maxLength="5"
                          className="w-full mt-1 px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 font-mono text-center text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Retour (HH:MM)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                          placeholder="15:30"
                          value={prayerBreak.in}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                              setCreateForm(prev => {
                                const newBreaks = [...prev.prayerBreaks];
                                newBreaks[idx].in = val;
                                return { ...prev, prayerBreaks: newBreaks };
                              });
                            }
                          }}
                          maxLength="5"
                          className="w-full mt-1 px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 font-mono text-center text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Prayer Allowance Info */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 mt-4">
                <p className="text-xs font-semibold text-amber-900">ℹ️ Information</p>
                <p className="text-xs text-amber-700 mt-1">Remplissez jusqu'à <strong>{ALLOWED_PRAYER_BREAKS} pauses de prière</strong>. Vous pouvez laisser certains champs vides si non utilisés.</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" lang="fr-FR">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Modifier le pointage</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Heure d'entrée (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="09:00"
                  value={editForm.clockIn}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setEditForm(f => ({ ...f, clockIn: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Heure de sortie (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="18:00"
                  value={editForm.clockOut}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setEditForm(f => ({ ...f, clockOut: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Sortie Déjeuner (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="12:00"
                  value={editForm.lunchOut}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setEditForm(f => ({ ...f, lunchOut: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Retour Déjeuner (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="13:00"
                  value={editForm.lunchIn}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setEditForm(f => ({ ...f, lunchIn: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Départ Prière 1 (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="15:00"
                  value={editForm.prayerOut}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setEditForm(f => ({ ...f, prayerOut: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Retour Prière 1 (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="15:30"
                  value={editForm.prayerIn}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setEditForm(f => ({ ...f, prayerIn: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Départ Prière 2 (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="18:00"
                  value={editForm.prayer2Out}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setEditForm(f => ({ ...f, prayer2Out: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Retour Prière 2 (HH:MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder="18:30"
                  value={editForm.prayer2In}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) || val.length <= 5) {
                      setEditForm(f => ({ ...f, prayer2In: val }));
                    }
                  }}
                  maxLength="5"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Heures Sup. (en heures décimales, ex: 1.5)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  value={editForm.overtime}
                  onChange={(e) => setEditForm(f => ({ ...f, overtime: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono text-center text-lg"
                />
              </div>

              {/* Prayer Allowance Info */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs font-semibold text-blue-900">📿 Pauses de prière autorisées</p>
                <p className="text-xs text-blue-700 mt-1">Selon votre horaire de travail, vous pouvez prendre <strong>jusqu'à 2 pauses de prière</strong> par jour. Ce nombre est calculé automatiquement en fonction de votre lieu de travail.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Motif</label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Ex: Oubli de pointage, correction..."
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
