import { useDashboardData } from '../api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Clock, Activity, CheckSquare } from 'lucide-react';

export function ManagerDashboard() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Erreur de chargement du tableau de bord</div>
      </div>
    );
  }

  const defaultStats = { 
    teamSize: 0, 
    pendingLeaves: 0 
  };

  const stats = data?.stats || defaultStats;

  const statCards = [
    { title: 'Taille de l\'équipe', value: stats.teamSize || 0, icon: Users, color: 'text-sky-500 bg-sky-50' },
    { title: 'Congés équipe en attente', value: stats.pendingLeaves || 0, icon: Clock, color: 'text-amber-500 bg-amber-50' },
    { title: 'Tâches en cours', value: 0, icon: CheckSquare, color: 'text-emerald-500 bg-emerald-50' }, // Placeholder
    { title: 'Alertes équipe', value: 0, icon: Activity, color: 'text-red-500 bg-red-50' }, // Placeholder
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Espace Manager 👤</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
}
