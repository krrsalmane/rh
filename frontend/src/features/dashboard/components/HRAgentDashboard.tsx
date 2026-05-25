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
          <h1 className="text-2xl font-bold text-gray-900">Espace RH</h1>
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
        {/* Absence Trends */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              Évolution des absences
            </h3>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Tendances
            </span>
          </div>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={260} minWidth={0}>
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="agentBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 8 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.month}</p>
                          <p className="text-2xl font-black text-sky-600 leading-none">
                            {payload[0].value} <span className="text-xs font-medium text-slate-400">absences</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#agentBarGradient)" 
                  radius={[10, 10, 0, 0]} 
                  barSize={32}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <PieChartIcon className="w-5 h-5 text-fuchsia-500" />
              Répartition par département
            </h3>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Structure
            </span>
          </div>
          <div className="h-72 w-full flex items-center justify-center relative min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={260} minWidth={0}>
              <PieChart>
                <Pie
                  data={distribution}
                  innerRadius={75}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1800}
                >
                  {distribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                          <p className="text-2xl font-black leading-none" style={{ color: payload[0].payload.fill || payload[0].color }}>
                            {payload[0].value} <span className="text-xs font-medium text-slate-400">employés</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text for Donut */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800 leading-none">{stats.totalEmployees}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Total</span>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 justify-center">
            {distribution.map((d, i) => (
              <div key={i} className="flex items-center gap-2 group cursor-default">
                <div 
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" 
                  style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                />
                <span className="text-xs text-slate-600 font-bold group-hover:text-slate-900 transition-colors">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
