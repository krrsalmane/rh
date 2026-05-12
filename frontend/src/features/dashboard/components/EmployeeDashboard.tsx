import { useDashboardData } from '../api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, CheckSquare, Calendar, Wallet } from 'lucide-react';

export function EmployeeDashboard() {
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

  console.log('Employee Dashboard Data:', data);

  const defaultStats = { 
    pendingLeaves: 0, 
    pendingTasks: 0, 
    availableBalance: 0 
  };

  const stats = data?.stats || defaultStats;
  const nextHoliday = data?.nextHoliday || null;

  console.log('Employee Stats:', stats);

  const statCards = [
    { title: 'Solde congés', value: `${stats.availableBalance || 0}j`, icon: Wallet, color: 'text-emerald-500 bg-emerald-50' },
    { title: 'Demandes en attente', value: stats.pendingLeaves || 0, icon: Clock, color: 'text-amber-500 bg-amber-50' },
    { title: 'Tâches à faire', value: stats.pendingTasks || 0, icon: CheckSquare, color: 'text-sky-500 bg-sky-50' },
    { title: 'Prochain jour férié', value: nextHoliday?.name || 'Aucun à venir', icon: Calendar, color: 'text-fuchsia-500 bg-fuchsia-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour ! 👋</h1>
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Derniers mouvements
        </h3>
        <p className="text-sm text-gray-500 italic">Consultez vos modules Tâches et Congés pour plus de détails.</p>
      </div>
    </div>
  );
}
