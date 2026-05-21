import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, FileText, Clock, Settings, LogOut } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/shared/constants/routes';
import { useEmployeeData } from '../hooks/useEmployeeData';
import { useNotifications } from '@/hooks/useNotifications';

export const EmployeePortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { notifications } = useNotifications();
  const { 
    profile, 
    leaveBalance, 
    documents, 
    timeEntries,
    isLoading 
  } = useEmployeeData();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: User,
      description: 'Vue d\'ensemble de vos informations',
      color: 'bg-blue-500'
    },
    {
      id: 'profile',
      label: 'Mon profil',
      icon: Settings,
      description: 'Gérer vos informations personnelles',
      color: 'bg-green-500'
    },
    {
      id: 'leaves',
      label: 'Congés',
      icon: Calendar,
      description: 'Consulter vos soldes et demandes',
      color: 'bg-purple-500'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      description: 'Accéder à vos documents',
      color: 'bg-orange-500'
    },
    {
      id: 'timesheet',
      label: 'Pointage',
      icon: Clock,
      description: 'Consulter vos heures de travail',
      color: 'bg-indigo-500'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Bienvenue, {user?.email?.split('@')[0] || 'Employé'}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Solde de congés</span>
                    <span className="text-2xl font-bold text-blue-600">{leaveBalance?.totalDays || 0}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{leaveBalance?.approved || 0}</div>
                      <div className="text-xs text-gray-500">Approuvés</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{leaveBalance?.pending || 0}</div>
                      <div className="text-xs text-gray-500">En attente</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Activité récente
                </h3>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Mon profil</h2>
              </div>
              <div className="p-6">
                {profile ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profile.firstName} {profile.lastName}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profile.email}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profile.department}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Poste</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {profile.position}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                        Mettre à jour le profil
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'leaves':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Mes congés</h2>
                <button
                  onClick={() => navigate('/leaves/request')}
                  className="btn-primary"
                >
                  Nouvelle demande
                </button>
              </div>
              
              <div className="space-y-4">
                {leaveBalance?.byType?.map((balance: any) => (
                  <div key={balance.type} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-900">{balance.type}</h3>
                      <span className="text-2xl font-bold text-purple-600">{balance.total}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-green-600">{balance.used}</div>
                        <div className="text-xs text-gray-500">Utilisés</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-orange-600">{balance.pending}</div>
                        <div className="text-xs text-gray-500">En attente</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-blue-600">{balance.remaining}</div>
                        <div className="text-xs text-gray-500">Restants</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Mes documents</h2>
                <button
                  onClick={() => navigate('/documents')}
                  className="btn-primary"
                >
                  Voir tous les documents
                </button>
              </div>
              
              <div className="space-y-4">
                {documents?.slice(0, 5).map((doc: any) => (
                  <div key={doc.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <FileText className="w-8 h-8 text-orange-500 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                        <p className="text-sm text-gray-500">{doc.type}</p>
                        <p className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'timesheet':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Mon pointage</h2>
                <button
                  onClick={() => {
                    // TODO: Implement clock in/out functionality
                    console.log('Clock in/out clicked');
                  }}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                >
                  Pointer l'entrée
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Cette semaine</h3>
                    <div className="text-2xl font-bold text-blue-600">38h</div>
                    <div className="text-sm text-gray-500">sur 40h travaillées</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Ce mois</h3>
                    <div className="text-2xl font-bold text-green-600">152h</div>
                    <div className="text-sm text-gray-500">sur 160h travaillées</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Espace Employé</h1>
                <p className="text-sm text-gray-500">Bienvenue, {user?.email?.split('@')[0] || 'Employé'}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {/* TODO: Logout */}}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-6 rounded-xl border-2 transition-all ${
                activeTab === item.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mb-3`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">{item.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </div>
    </div>
  );
};
