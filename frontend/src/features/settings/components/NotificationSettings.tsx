import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    weeklyReport: false,
    pushNewRequests: true,
    pushUrgentAlerts: true,
  });

  const handleSave = () => {
    toast.success('Préférences de notification enregistrées');
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Préférences de notification</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choisissez comment vous souhaitez être informé</p>
          </div>
        </div>

        <div className="p-8 space-y-10">
          {/* Email Notifications */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Notifications Email</h4>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-900">Alertes de workflow</p>
                  <p className="text-xs text-gray-500 mt-1">Recevoir un email pour chaque nouvelle demande de congé ou absence</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.emailAlerts}
                    onChange={(e) => setSettings({...settings, emailAlerts: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-900">Rapport hebdomadaire</p>
                  <p className="text-xs text-gray-500 mt-1">Un résumé chaque lundi matin de l'activité de l'entreprise</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.weeklyReport}
                    onChange={(e) => setSettings({...settings, weeklyReport: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Push Notifications */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <Smartphone className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Notifications Push (In-App)</h4>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-900">Nouvelles demandes</p>
                  <p className="text-xs text-gray-500 mt-1">Notifications instantanées dans l'interface pour les nouvelles actions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.pushNewRequests}
                    onChange={(e) => setSettings({...settings, pushNewRequests: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-tight">Vos données sont sécurisées</span>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
