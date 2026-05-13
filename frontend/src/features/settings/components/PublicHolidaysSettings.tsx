import React, { useEffect, useState } from 'react';
import { holidaysApi } from '../api';
import { CalendarHeart, Plus, Trash2, Loader2, Inbox, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Holiday {
  id: string;
  name: string;
  date: string;
  is_recurring: boolean;
}

export const PublicHolidaysSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', isRecurring: false });

  const fetchHolidays = async () => {
    try {
      const data = await holidaysApi.getAll();
      setHolidays(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des jours fériés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await holidaysApi.create(newHoliday);
      toast.success('Jour férié ajouté');
      setShowAdd(false);
      setNewHoliday({ name: '', date: '', isRecurring: false });
      fetchHolidays();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce jour férié ?')) return;
    try {
      await holidaysApi.delete(id);
      toast.success('Jour férié supprimé');
      fetchHolidays();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Calendrier des jours fériés</h3>
          <p className="text-sm text-gray-500 mt-0.5">Configurez les dates de fermeture de l'entreprise</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-all shadow-md shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          Ajouter une date
        </button>
      </div>

      {showAdd && (
        <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-6 animate-slide-up">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-sky-700 uppercase mb-2">Libellé</label>
              <input
                type="text"
                required
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:border-sky-400 outline-none text-sm bg-white"
                placeholder="Ex: Fête du Travail"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-sky-700 uppercase mb-2">Date</label>
              <input
                type="date"
                required
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-sky-200 focus:border-sky-400 outline-none text-sm bg-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-xl font-bold transition-colors"
              >
                Confirmer
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 border border-sky-200 text-sky-600 hover:bg-sky-100 rounded-xl font-bold transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {holidays.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center">
            <Inbox className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm font-medium">Aucun jour férié configuré</p>
          </div>
        ) : (
          holidays.map((h) => (
            <div key={h.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-sky-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-sky-50 text-slate-400 group-hover:text-sky-500 transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight">{h.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(h.date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(h.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
