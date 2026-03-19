import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/shared/api/axiosInstance';
import { Clock, UserX, Users } from 'lucide-react';

export function ManagerDashboard() {


  // APIs are inherently filtered by manager id in backend for these endpoints when role=manager
  const { data: leavesData } = useQuery({ queryKey: ['team-leaves'], queryFn: () => axiosInstance.get('/leave-requests?status=pending&limit=5') });
  const { data: absData } = useQuery({ queryKey: ['team-absences'], queryFn: () => axiosInstance.get('/absences?limit=1') });

  const pendingLeaves = leavesData?.data?.total || 0;
  const teamAbsences = absData?.data?.total || 0;
  
  const leaveItems = Array.isArray(leavesData?.data?.data) ? leavesData.data.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, Manager 👋</h1>
        <p className="text-sm text-gray-500">Gérez votre équipe</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Congés en attente (équipe)', value: pendingLeaves, icon: Clock, color: 'text-amber-500 bg-amber-50' },
          { title: 'Absences récentes (équipe)', value: teamAbsences, icon: UserX, color: 'text-red-500 bg-red-50' },
          { title: 'Membres équipe', value: '--', icon: Users, color: 'text-sky-500 bg-sky-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Demandes de mon équipe
        </h3>
        <div className="space-y-3">
          {leaveItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucune demande d'équipe en attente</p>
          ) : (
            leaveItems.map((item: any) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                <div>
                  <p className="font-medium text-sm">{item.employee?.firstName} {item.employee?.lastName}</p>
                  <p className="text-xs text-gray-500">{item.leaveType?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors">
                    Approuver
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors">
                    Rejeter
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
