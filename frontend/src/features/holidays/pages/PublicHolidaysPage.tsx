import React, { useState } from 'react';
import { Calendar, Plus, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { usePublicHolidays, useCreatePublicHoliday, useUpdatePublicHoliday, useDeletePublicHoliday } from '../hooks/useHolidays';
import type { PublicHoliday, CreatePublicHolidayDto } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EMPTY_FORM: CreatePublicHolidayDto = { name: '', date: '', year: new Date().getFullYear(), isRecurring: false };

export const PublicHolidaysPage: React.FC = () => {
  const role = useAppSelector((s) => s.auth.role);
  const canEdit = role === 'super_admin' || role === 'hr_agent';

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { data: holidays, isLoading } = usePublicHolidays(currentYear);
  const createMut = useCreatePublicHoliday();
  const updateMut = useUpdatePublicHoliday();
  const deleteMut = useDeletePublicHoliday();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePublicHolidayDto>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (h: PublicHoliday) => {
    setEditingId(h.id);
    setForm({ name: h.name, date: h.date, year: h.year, isRecurring: h.isRecurring });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, year: new Date(form.date).getFullYear() };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: payload }, { onSuccess: () => { setShowForm(false); setEditingId(null); } });
    } else {
      createMut.mutate(payload, { onSuccess: () => { setShowForm(false); setForm(EMPTY_FORM); } });
    }
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd MMMM', { locale: fr }); } catch { return d; }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up" id="public-holidays-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Jours fériés</h1>
            <p className="text-sm text-slate-400">Calendrier des jours chômés</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={currentYear} 
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-200"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {canEdit && !showForm && (
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800">{editingId ? 'Modifier le jour férié' : 'Nouveau jour férié'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Nom du jour férié</label>
              <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="ex: Fête du Travail"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
              className="w-4 h-4 rounded accent-amber-500" />
            <span className="text-sm text-slate-700">Récurrent chaque année</span>
          </label>
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button type="submit" disabled={createMut.isPending || updateMut.isPending}
              className="px-6 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50">
              {editingId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }} className="px-4 py-2 text-sm text-slate-500">Annuler</button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
        ) : (holidays || []).length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun jour férié pour {currentYear}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {holidays!.sort((a, b) => a.date.localeCompare(b.date)).map((h) => (
              <div key={h.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {format(new Date(h.date), 'MMM', { locale: fr })}
                    </span>
                    <span className="text-xl font-black text-slate-700 leading-none">
                      {format(new Date(h.date), 'dd')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{h.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      {h.isRecurring && <RefreshCw className="w-3 h-3 text-amber-500" />}
                      {h.isRecurring ? 'Chaque année' : `Seulement en ${h.year}`}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {deleteConfirm === h.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => deleteMut.mutate(h.id, { onSuccess: () => setDeleteConfirm(null) })} className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg">Oui</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">Non</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(h)} className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-xl"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(h.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
