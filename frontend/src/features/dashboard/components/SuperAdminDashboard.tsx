import { useDashboardData } from '../api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Clock, UserX, UserCog, Activity, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899'];

export function SuperAdminDashboard() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  const { stats, distribution, trends, alerts, recentActivity } = data || { 
    stats: { totalEmployees: 0, totalUsers: 0, pendingLeaves: 0, pendingAbsences: 0 }, 
    distribution: [], 
    trends: [], 
    alerts: [],
    recentActivity: [] 
  };

  const statCards = [
    { title: 'Total employés', value: stats.totalEmployees, icon: Users, color: 'text-sky-500 bg-sky-50' },
    { title: 'Congés en attente', value: stats.pendingLeaves, icon: Clock, color: 'text-amber-500 bg-amber-50' },
    { title: 'Absences à justifier', value: stats.pendingAbsences, icon: UserX, color: 'text-red-500 bg-red-50' },
    { title: 'Utilisateurs', value: stats.totalUsers, icon: UserCog, color: 'text-fuchsia-500 bg-fuchsia-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, Admin 👋</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
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

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert: any, i: number) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start animate-pulse-subtle">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">{alert.title}</h4>
                <p className="text-sm text-amber-700">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absence Trends */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500" />
            Tendances des absences (6 mois)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Activité récente
          </h3>
          <div className="space-y-6">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucune activité récente</p>
            ) : (
              recentActivity.map((log: any) => (
                <div key={log.id} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 relative z-10">
                      <Activity className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="w-0.5 flex-1 bg-slate-50 -mb-6" />
                  </div>
                  <div className="pb-6">
                    <p className="text-sm text-gray-800 font-medium">
                      {log.action} <span className="text-gray-400">sur</span> {log.entity}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {log.user_email || 'Système'} · {format(new Date(log.timestamp), 'dd MMM HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
