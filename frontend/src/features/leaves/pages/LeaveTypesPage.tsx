import React, { useState } from 'react';
import { Tag, Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useLeaveTypes, useCreateLeaveType, useUpdateLeaveType, useDeleteLeaveType } from '../hooks/useLeaves';
import type { LeaveType, CreateLeaveTypeDto } from '../types';

const EMPTY_FORM: CreateLeaveTypeDto = { name: '', annualDays: undefined, accrualRule: 'monthly', carryOverMax: 0, requiresApproval: true };

export const LeaveTypesPage: React.FC = () => {
  const role = useAppSelector((s) => s.auth.role);
  const canEdit = role === 'super_admin' || role === 'hr_agent';
  const canDelete = role === 'super_admin';

  const { data: leaveTypes, isLoading } = useLeaveTypes();
  const createMut = useCreateLeaveType();
  const updateMut = useUpdateLeaveType();
  const deleteMut = useDeleteLeaveType();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateLeaveTypeDto>(EMPTY_FORM);

  const set = (field: keyof CreateLeaveTypeDto, val: string | number | boolean) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleEdit = (lt: LeaveType) => {
    setEditingId(lt.id);
    setForm({ name: lt.name, annualDays: lt.annualDays ?? undefined, accrualRule: lt.accrualRule ?? 'monthly', carryOverMax: lt.carryOverMax, requiresApproval: lt.requiresApproval });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updateMut.mutate({ id: editingId, data: form }, { onSuccess: () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); } });
    } else {
      createMut.mutate(form, { onSuccess: () => { setShowForm(false); setForm(EMPTY_FORM); } });
    }
  };

  const handleCancel = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

  return (
    <div className="space-y-6 animate-fade-in-up" id="leave-types-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Types de congés</h1>
            <p className="text-sm text-slate-400">{leaveTypes?.length || 0} type{leaveTypes?.length !== 1 ? 's' : ''} configuré{leaveTypes?.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {canEdit && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouveau type
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800">{editingId ? 'Modifier le type de congé' : 'Nouveau type de congé'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Nom <span className="text-rose-500">*</span></label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="ex: Congé Annuel"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Jours par an</label>
              <input type="number" min="0" value={form.annualDays ?? ''} onChange={(e) => set('annualDays', Number(e.target.value))} placeholder="ex: 26"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Règle d'accrual</label>
              <select value={form.accrualRule || 'monthly'} onChange={(e) => set('accrualRule', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400">
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Report max (jours)</label>
              <input type="number" min="0" value={form.carryOverMax ?? 0} onChange={(e) => set('carryOverMax', Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.requiresApproval ?? true} onChange={(e) => set('requiresApproval', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500" />
            <span className="text-sm text-slate-700">Nécessite une approbation</span>
          </label>
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button type="submit" disabled={createMut.isPending || updateMut.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-all disabled:opacity-50">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Enregistrer' : 'Créer'}
            </button>
            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Annuler</button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
        ) : (leaveTypes || []).length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun type de congé configuré</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Jours/an</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Accrual</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Report max</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Approbation</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                {canEdit && <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(leaveTypes || []).map((lt) => (
                <tr key={lt.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800 text-sm">{lt.name}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">{lt.annualDays ?? '—'}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-500 capitalize">{lt.accrualRule || '—'}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-500">{lt.carryOverMax ?? 0} j</td>
                  <td className="px-6 py-4 text-center">
                    {lt.requiresApproval
                      ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${lt.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {lt.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEdit(lt)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                        {canDelete && <button onClick={() => deleteMut.mutate(lt.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
