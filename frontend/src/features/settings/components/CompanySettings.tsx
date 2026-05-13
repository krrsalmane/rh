import React, { useEffect, useState } from 'react';
import { companyApi } from '../api';
import { Building2, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const CompanySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ name: '', address: '', logoUrl: '' });

  useEffect(() => {
    companyApi.get()
      .then((data) => setData(data))
      .catch(() => toast.error('Erreur lors du chargement des paramètres'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companyApi.update(data);
      toast.success('Paramètres mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Profil de l'entreprise</h3>
            <p className="text-xs text-gray-500 mt-0.5">Informations visibles sur les documents officiels</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          {/* Logo Section */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Logo de l'entreprise</label>
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden relative group">
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-medium">Aucun logo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <span className="text-white text-xs font-bold">Changer</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nom de l'entreprise</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all outline-none text-sm font-medium"
                  placeholder="Ex: Maya Digital"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Adresse du siège</label>
                <textarea
                  value={data.address}
                  onChange={(e) => setData({ ...data, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all outline-none text-sm font-medium resize-none"
                  placeholder="Adresse complète..."
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20 hover:-translate-y-0.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
