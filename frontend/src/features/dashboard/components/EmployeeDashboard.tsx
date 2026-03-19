
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import axiosInstance from '@/shared/api/axiosInstance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, Clock, UserX } from 'lucide-react';

export function EmployeeDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  
  // Note: the backend handles the mapping of user.id -> employee record
  const { data: leavesData } = useQuery({ queryKey: ['my-leaves'], queryFn: () => axiosInstance.get('/leave-requests?limit=5') });
  const { data: absData } = useQuery({ queryKey: ['my-absences'], queryFn: () => axiosInstance.get('/absences?limit=1') });
  const { data: balanceData } = useQuery({ queryKey: ['my-balances'], queryFn: () => axiosInstance.get('/leave-balances') });

  const totalLeaves = balanceData?.data?.data?.[0]?.remainingDays || '--';
  const takenLeaves = balanceData?.data?.data?.[0]?.takenDays || '--';
  const myAbsences = absData?.data?.total || 0;

  const leaveItems = Array.isArray(leavesData?.data?.data) ? leavesData.data.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user?.email?.split('@')[0]} 👋</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Solde congés (jours)', value: totalLeaves, icon: CalendarDays, color: 'text-emerald-500 bg-emerald-50' },
          { title: 'Congés pris', value: takenLeaves, icon: Clock, color: 'text-amber-500 bg-amber-50' },
          { title: 'Mes absences', value: myAbsences, icon: UserX, color: 'text-red-500 bg-red-50' },
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
          <Clock className="w-4 h-4 text-emerald-500" />
          Mes demandes récentes
        </h3>
        <div className="space-y-3">
          {leaveItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Vous n'avez aucune demande récente</p>
          ) : (
            leaveItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{item.leaveType?.name}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(item.start_date || item.startDate || Date.now()), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                {item.status === 'pending' && <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-1 rounded">En attente</span>}
                {item.status === 'approved' && <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-1 rounded">Approuvé</span>}
                {item.status === 'rejected' && <span className="text-xs bg-red-100 text-red-700 font-medium px-2 py-1 rounded">Rejeté</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
