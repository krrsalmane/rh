import React, { useState } from 'react';
import { CalendarRange, Plus, Pencil, Trash2, Loader2, Check, X, Clock } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { FormCard, FormField, FormGrid, FormInput, FormFooter } from '@/shared/components/forms';
import { useWorkSchedules, useCreateWorkSchedule, useUpdateWorkSchedule, useDeleteWorkSchedule } from '../hooks/useTime';
import type { WorkSchedule, CreateWorkScheduleDto } from '../types';

const DAYS_FR: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu', friday: 'Ven', saturday: 'Sam', sunday: 'Dim'
};

const EMPTY_FORM: CreateWorkScheduleDto = { 
  name: '', 
  weeklyHours: 44, 
  dailyHours: 8, 
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  breakMinutes: 60,
  isRotating: false
};

export const WorkSchedulesPage: React.FC = () => {
  const role = useAppSelector((s) => s.auth.role);
  const canEdit = role === 'super_admin' || role === 'hr_agent';

  const { data: schedules, isLoading } = useWorkSchedules();
  const createMut = useCreateWorkSchedule();
  const updateMut = useUpdateWorkSchedule();
  const deleteMut = useDeleteWorkSchedule();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateWorkScheduleDto>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (s: WorkSchedule) => {
    setEditingId(s.id);
    setForm({ 
      name: s.name, 
      weeklyHours: s.weeklyHours, 
      dailyHours: s.dailyHours, 
      workDays: s.workDays,
      breakMinutes: s.breakMinutes,
      isRotating: s.isRotating
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMut.mutate({ id: editingId, data: form }, { onSuccess: () => { setShowForm(false); setEditingId(null); } });
    } else {
      createMut.mutate(form, { onSuccess: () => { setShowForm(false); } });
    }
  };

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      workDays: f.workDays.includes(day) 
        ? f.workDays.filter(d => d !== day) 
        : [...f.workDays, day]
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="work-schedules-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <CalendarRange className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Horaires de travail</h1>
            <p className="text-sm text-slate-400">Configuration des shifts et semaines types</p>
          </div>
        </div>
        {canEdit && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouvel horaire
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <FormCard title={editingId ? "Modifier l'horaire" : 'Nouvel horaire'}>
            <FormGrid>
              <FormField label="Nom de l'horaire" required>
                <FormInput name="name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Bureau standard" />
              </FormField>
              <FormField label="Heures hebdo.">
                <FormInput name="weeklyHours" type="number" step="0.5" value={String(form.weeklyHours)} onChange={(e) => setForm(f => ({ ...f, weeklyHours: Number(e.target.value) }))} />
              </FormField>
              <FormField label="Pause (min)">
                <FormInput name="breakMinutes" type="number" value={String(form.breakMinutes)} onChange={(e) => setForm(f => ({ ...f, breakMinutes: Number(e.target.value) }))} />
              </FormField>
            </FormGrid>

            <div className="space-y-2">
              <label className="form-label">Jours travaillés</label>
              <div className="flex gap-2">
                {Object.entries(DAYS_FR).map(([en, fr]) => (
                  <button type="button" key={en} onClick={() => toggleDay(en)}
                    aria-pressed={form.workDays.includes(en)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                      form.workDays.includes(en) ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}>
                    {fr}
                  </button>
                ))}
              </div>
            </div>

            <FormFooter onCancel={() => { setShowForm(false); setEditingId(null); }} submitText={editingId ? 'Mettre à jour' : 'Créer'} isLoading={createMut.isPending || updateMut.isPending} />
          </FormCard>
        </form>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
        ) : schedules?.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-slate-800">{s.name}</h3>
              {canEdit && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Hebdo</p>
                <p className="text-lg font-black text-slate-700">{s.weeklyHours}h</p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Journalier</p>
                <p className="text-lg font-black text-slate-700">{s.dailyHours}h</p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Pause</p>
                <p className="text-lg font-black text-slate-700">{s.breakMinutes}m</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {Object.entries(DAYS_FR).map(([en, fr]) => (
                <span key={en} className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.workDays.includes(en) ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                  {fr}
                </span>
              ))}
            </div>

            {deleteConfirm === s.id && (
              <div className="pt-2 flex items-center gap-2 border-t border-slate-50">
                <p className="text-xs text-rose-500 font-medium">Supprimer ?</p>
                <button onClick={() => deleteMut.mutate(s.id, { onSuccess: () => setDeleteConfirm(null) })} className="btn-form-danger text-xs">Oui</button>
                <button onClick={() => setDeleteConfirm(null)} className="btn-form-cancel text-xs">Non</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
