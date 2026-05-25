import React, { useState, useRef, useEffect } from 'react';
import { Clock, Loader2, ChevronLeft, ChevronRight, Filter, Download, Edit3, Trash2, CheckCircle, ChevronDown } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useTimeEntries, useTimeSummary, useExportTimeReport, useUpdateTimeEntry, useCreateTimeEntry, useRecordTimeAction, useDeleteTimeEntry } from '../hooks/useTime';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import type { TimeEntryFilters, TimeEntry } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Modal, FormFooter } from '@/shared/components/forms';
import { TimeEntryCreateForm } from '../components/TimeEntryCreateForm';

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
  const uniqueEmployees = Array.from(
    new Map((employeesData?.data ?? []).map((employee: any) => [employee.id, employee])).values()
  );
  const employeeList = role === 'employee'
    ? uniqueEmployees.filter((emp: any) => emp.id === effectiveAuthId)
    : uniqueEmployees;
  const pagination = data?.pagination;

  const [statusFilter, setStatusFilter] = useState<'all' | 'arrive_late' | 'left_early' | 'late_lunch'>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const pointageButtonClass = (recorded: boolean, canPerform: boolean) => {
    const base = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-[13px] transition-all border';

    if (recorded) {
      return `${base} bg-slate-100 border-slate-200 text-slate-700 cursor-default`;
    }

    if (canPerform) {
      return `${base} bg-blue-600 border-blue-700 text-white hover:bg-blue-700 shadow-sm`;
    }

    return `${base} bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed`;
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
    if (!decimalHours || decimalHours <= 0) return '0 min';
    const totalMinutes = Math.max(0, Math.round(decimalHours * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="time-management-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div ref={exportMenuRef} className="relative">
            <button
              type="button"
              disabled={exportMut.isLoading}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exportMut.isLoading ? 'Export en cours...' : 'Exporter'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                <button
                  type="button"
                  disabled={exportMut.isLoading}
                  onClick={() => {
                    handleExport('csv');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  type="button"
                  disabled={exportMut.isLoading}
                  onClick={() => {
                    handleExport('pdf');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2 border-t border-slate-100 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            )}
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary"
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
                        className={pointageButtonClass(isRecorded('morning-in'), canPerform('morning-in'))}
                      >
                        {isRecorded('morning-in') && <CheckCircle className="w-3.5 h-3.5" />} Entrée
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'morning-out'); }}
                        disabled={!canPerform('morning-out')}
                        className={pointageButtonClass(isRecorded('morning-out'), canPerform('morning-out'))}
                      >
                        {isRecorded('morning-out') && <CheckCircle className="w-3.5 h-3.5" />} Sortie
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'lunch-out'); }}
                        disabled={!canPerform('lunch-out')}
                        className={pointageButtonClass(isRecorded('lunch-out'), canPerform('lunch-out'))}
                      >
                        {isRecorded('lunch-out') && <CheckCircle className="w-3.5 h-3.5" />} Départ Déj.
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, 'lunch-in'); }}
                        disabled={!canPerform('lunch-in')}
                        className={pointageButtonClass(isRecorded('lunch-in'), canPerform('lunch-in'))}
                      >
                        {isRecorded('lunch-in') && <CheckCircle className="w-3.5 h-3.5" />} Retour Déj.
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, !rowEntry?.prayerOut ? 'prayer-out' : 'prayer2-out'); }}
                        disabled={!canPerformPrayerOut}
                        className={pointageButtonClass(isAllPrayerOutRecorded, canPerformPrayerOut)}
                      >
                        {isAllPrayerOutRecorded && <CheckCircle className="w-3.5 h-3.5" />} Départ Prière
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTimeAction(emp.id, (rowEntry?.prayerOut && !rowEntry?.prayerIn) ? 'prayer-in' : 'prayer2-in'); }}
                        disabled={!canPerformPrayerIn}
                        className={pointageButtonClass(isAllPrayerInRecorded, canPerformPrayerIn)}
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
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${rowEntry ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} transition`}
                            aria-label="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (rowEntry) handleDeleteEntry(rowEntry.id); }}
                            disabled={!rowEntry}
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${rowEntry ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} transition`}
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
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Ajouter un pointage"
        size="large"
      >
        <TimeEntryCreateForm
          key={isCreateOpen ? 'open' : 'closed'}
          form={createForm}
          onChange={setCreateForm}
          employees={uniqueEmployees.map((emp: { id: string; firstName: string; lastName: string }) => ({
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
          }))}
          allowedPrayerBreaks={ALLOWED_PRAYER_BREAKS}
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSave}
          isLoading={createMut.isPending}
        />
      </Modal>

      <Modal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        title="Modifier le pointage"
        size="large"
      >
            <div className="space-y-4" lang="fr-FR">
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
            <FormFooter
              onCancel={() => setEditingEntry(null)}
              submitText={updateMut.isLoading ? 'Enregistrement...' : 'Enregistrer'}
              submitType="button"
              onSubmit={handleSaveEdit}
              isLoading={updateMut.isLoading}
            />
      </Modal>
    </div>
  );
};
