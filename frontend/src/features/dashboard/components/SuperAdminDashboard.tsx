
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/shared/api/axiosInstance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Clock, UserX, UserCog, Activity } from 'lucide-react';

export function SuperAdminDashboard() {
  const { data: empData } = useQuery({ queryKey: ['emps'], queryFn: () => axiosInstance.get('/employees?limit=1') });
  const { data: leavesData } = useQuery({ queryKey: ['leaves'], queryFn: () => axiosInstance.get('/leave-requests?status=pending&limit=5') });
  const { data: absData } = useQuery({ queryKey: ['abs'], queryFn: () => axiosInstance.get('/absences?justificationStatus=pending&limit=1') });
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: () => axiosInstance.get('/users?limit=1') });
  const { data: auditData } = useQuery({ queryKey: ['audit'], queryFn: () => axiosInstance.get('/audit-logs?limit=5') });

  const totalEmps = empData?.data?.pagination?.total || 0;
  const pendingLeaves = leavesData?.data?.total || 0;
  const pendingAbs = absData?.data?.total || 0;
  const totalUsers = usersData?.data?.pagination?.total || 0;

  const leaveItems = Array.isArray(leavesData?.data?.data) ? leavesData.data.data : [];
  const auditItems = Array.isArray(auditData?.data?.data) ? auditData.data.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, Admin 👋</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total employés', value: totalEmps, icon: Users, color: 'text-sky-500 bg-sky-50' },
          { title: 'Congés en attente', value: pendingLeaves, icon: Clock, color: 'text-amber-500 bg-amber-50' },
          { title: 'Absences non justifiées', value: pendingAbs, icon: UserX, color: 'text-red-500 bg-red-50' },
          { title: 'Utilisateurs', value: totalUsers, icon: UserCog, color: 'text-fuchsia-500 bg-fuchsia-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Demandes en attente
          </h3>
          <div className="space-y-3">
            {leaveItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucune demande en attente</p>
            ) : (
              leaveItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.employee?.firstName} {item.employee?.lastName}</p>
                    <p className="text-xs text-gray-500">{item.leaveType?.name}</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-1 rounded">En attente</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-500" />
            Activité récente
          </h3>
          <div className="space-y-4">
            {auditItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucune activité récente</p>
            ) : (
              auditItems.map((log: any) => (
                <div key={log.id} className="flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800">{log.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Par {log.user?.email || 'Système'} · {format(new Date(log.created_at || log.createdAt || Date.now()), 'dd/MM HH:mm')}
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
