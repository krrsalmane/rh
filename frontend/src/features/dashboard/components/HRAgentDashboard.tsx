import { useDashboardData } from '../api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Clock, UserX, Activity, TrendingUp, PieChart as PieChartIcon, FileText } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899'];

export function HRAgentDashboard() {
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
    totalEmployees: 0, 
    pendingLeaves: 0, 
    pendingAbsences: 0 
  };

  const stats = data?.stats || defaultStats;
  const distribution = data?.distribution || [];
  const trends = data?.trends || [];
  const recentActivity = data?.recentActivity || [];

  const statCards = [
    { title: 'Effectif total', value: stats.totalEmployees, icon: Users, color: 'text-sky-500 bg-sky-50' },
    { title: 'Congés en attente', value: stats.pendingLeaves, icon: Clock, color: 'text-amber-500 bg-amber-50' },
    { title: 'Absences non justifiées', value: stats.pendingAbsences, icon: UserX, color: 'text-red-500 bg-red-50' },
    { title: 'Nouveaux documents', value: 0, icon: FileText, color: 'text-emerald-500 bg-emerald-50' }, // Placeholder for now
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace RH 🏢</h1>
          <p className="text-sm text-gray-500">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500" />
            Évolution des absences
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-fuchsia-500" />
            Répartition par département
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {distribution.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-gray-600 font-medium">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
