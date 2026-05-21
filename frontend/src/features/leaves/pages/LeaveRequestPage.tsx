import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowLeft, Loader2, Paperclip } from 'lucide-react';
import { useLeaveTypes, useCreateLeaveRequest } from '../hooks/useLeaves';
import { getBalances } from '../api';
import { useAppSelector } from '@/store/hooks';
import { getEmployees } from '@/features/employees/api';
import { useQuery } from '@tanstack/react-query';
import type { CreateLeaveRequestDto } from '../types';

export const LeaveRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.role);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const canChooseEmployee = role === 'super_admin' || role === 'hr_agent' || role === 'manager';

  const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();
  const { data: employeesData } = useQuery({
    queryKey: ['employees', { page: 1, limit: 100 }],
    queryFn: () => getEmployees({ page: 1, limit: 100 }),
    enabled: canChooseEmployee,
  });

  const [form, setForm] = useState<Partial<CreateLeaveRequestDto>>({});
  const [supportingDocument, setSupportingDocument] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createMut = useCreateLeaveRequest();

  const selectedEmployeeId = canChooseEmployee ? form.employeeId : (employeeId || userId);
  const { data: balances } = useQuery({
    queryKey: ['balances', selectedEmployeeId, new Date().getFullYear()],
    queryFn: () => getBalances(selectedEmployeeId!, new Date().getFullYear()),
    enabled: !!selectedEmployeeId,
  });

  const selectedBalance = balances?.find(b => b.leaveTypeId === form.leaveTypeId);

  const set = (field: keyof CreateLeaveRequestDto, val: any) =>
    setForm((f) => ({ ...f, [field]: val }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedEmployeeId) errs.employeeId = 'Veuillez sélectionner un employé';
    if (!form.leaveTypeId) errs.leaveTypeId = 'Veuillez sélectionner un type de congé';
    if (!form.startDate) errs.startDate = 'Date de début requise';
    if (!form.endDate) errs.endDate = 'Date de fin requise';
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      errs.endDate = 'La date de fin doit être après la date de début';

    if (form.workingDays && selectedBalance && form.workingDays > selectedBalance.remaining) {
      errs.workingDays = 'Solde insuffisant';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = new FormData();
    if (selectedEmployeeId) payload.append('employeeId', selectedEmployeeId);
    payload.append('leaveTypeId', form.leaveTypeId || '');
    payload.append('startDate', form.startDate || '');
    payload.append('endDate', form.endDate || '');
    if (form.reason) payload.append('reason', form.reason);
    if (typeof form.workingDays === 'number') payload.append('workingDays', String(form.workingDays));
    if (supportingDocument) payload.append('supportingDocument', supportingDocument);

    createMut.mutate(payload, {
      onSuccess: () => navigate('/leaves'),
    });
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-2.5 rounded-xl border text-slate-800 text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-rose-300 focus:ring-rose-200'
        : 'border-slate-200 focus:ring-violet-200 focus:border-violet-400'
    }`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up" id="leave-request-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/leaves')}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Nouvelle demande de congé</h1>
            <p className="text-sm text-slate-400">Remplissez le formulaire ci-dessous</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        
        {/* Employee selector (admin/hr/manager only) */}
        {canChooseEmployee ? (
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Employé <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.employeeId || ''}
              onChange={(e) => set('employeeId', e.target.value)}
              className={inputCls('employeeId')}
            >
              <option value="">Sélectionner un employé...</option>
              {(employeesData?.data || []).map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="text-xs text-rose-500">{errors.employeeId}</p>}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
            <p className="text-sm text-violet-700 font-medium">
              Demande pour : <span className="font-bold">Moi-même</span>
            </p>
            <input type="hidden" value={userId || ''} />
          </div>
        )}

        {/* Leave type */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Type de congé <span className="text-rose-500">*</span>
          </label>
          {typesLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
            </div>
          ) : (
            <select
              value={form.leaveTypeId || ''}
              onChange={(e) => set('leaveTypeId', e.target.value)}
              className={inputCls('leaveTypeId')}
            >
              <option value="">Sélectionner un type...</option>
              {(leaveTypes || []).map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          )}
          {form.leaveTypeId && (
            <p className="text-xs font-medium text-sky-600 mt-1">
              Solde restant : {selectedBalance?.remaining ?? 0} jours
            </p>
          )}
          {errors.leaveTypeId && <p className="text-xs text-rose-500">{errors.leaveTypeId}</p>}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Date de début <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={form.startDate || ''}
              onChange={(e) => set('startDate', e.target.value)}
              className={inputCls('startDate')}
            />
            {errors.startDate && <p className="text-xs text-rose-500">{errors.startDate}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Date de fin <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={form.endDate || ''}
              onChange={(e) => set('endDate', e.target.value)}
              min={form.startDate}
              className={inputCls('endDate')}
            />
            {errors.endDate && <p className="text-xs text-rose-500">{errors.endDate}</p>}
          </div>
        </div>

        {/* Working days */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Nombre de jours ouvrables{' '}
            <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input
            type="number"
            min="1"
            placeholder="Calculé automatiquement si vide"
            value={form.workingDays ?? ''}
            onChange={(e) => set('workingDays', e.target.value === '' ? undefined : Number(e.target.value))}
            className={inputCls('workingDays')}
          />
          {errors.workingDays && <p className="text-xs text-rose-500">{errors.workingDays}</p>}
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Description / motif <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            rows={4}
            value={form.reason || ''}
            onChange={(e) => set('reason', e.target.value)}
            placeholder="Expliquez brièvement le contexte de la demande..."
            className={`${inputCls('reason')} resize-none`}
          />
        </div>

        {/* Supporting document */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Pièce justificative <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-violet-300 hover:bg-violet-50/60">
            <Paperclip className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-medium text-slate-700">
              {supportingDocument?.name || 'Importer un PDF, JPG ou PNG'}
            </span>
            <span className="text-xs text-slate-400">Le fichier sert de justificatif pour le service RH</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => setSupportingDocument(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/leaves')}
            className="btn-form-cancel"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={createMut.isPending}
            className="btn-primary"
          >
            {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Soumettre la demande
          </button>
        </div>
      </form>
    </div>
  );
};