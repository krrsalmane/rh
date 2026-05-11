import React, { useState } from 'react';
import { 
  CheckSquare, Plus, Clock, AlertCircle, 
  MoreVertical, Calendar, User as UserIcon,
  Search, Filter, Loader2, Trash2, Edit2
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import type { Task, TaskStatus, TaskPriority, CreateTaskDto } from '../types';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'À faire', color: 'text-slate-600', bg: 'bg-slate-100' },
  in_progress: { label: 'En cours', color: 'text-sky-600', bg: 'bg-sky-100' },
  completed: { label: 'Terminé', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  cancelled: { label: 'Annulé', color: 'text-rose-600', bg: 'bg-rose-100' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Basse', color: 'text-slate-400' },
  medium: { label: 'Moyenne', color: 'text-sky-500' },
  high: { label: 'Haute', color: 'text-orange-500' },
  urgent: { label: 'Urgent', color: 'text-rose-600' },
};

export const TasksPage: React.FC = () => {
  const auth = useAppSelector((s) => s.auth);
  const canManage = auth.role !== 'employee';
  
  const [filters, setFilters] = useState({ page: 1, limit: 50 });
  const { data, isLoading } = useTasks(filters);
  const { data: employeesData } = useEmployees({ limit: 100 });
  
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasks = data?.data || [];
  const employees = employeesData?.data || [];

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    updateTaskMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const handleCreateOrUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dto: any = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      assignedTo: formData.get('assignedTo') as string || null,
      priority: formData.get('priority') as TaskPriority,
      dueDate: formData.get('dueDate') as string || null,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data: dto }, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingTask(null);
        }
      });
    } else {
      createTaskMutation.mutate(dto, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="tasks-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des Tâches</h1>
          <p className="text-slate-500 text-sm">Organisez et suivez le travail de l'équipe</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all shadow-sm shadow-sky-200"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Tâche
          </button>
        )}
      </div>

      {/* Kanban-like View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['pending', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map((status) => (
          <div key={status} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === 'pending' ? 'bg-slate-400' : status === 'in_progress' ? 'bg-sky-500' : status === 'completed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <h3 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
                  {STATUS_CONFIG[status].label}
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>

            <div className="flex flex-col gap-3 min-h-[200px]">
              {tasks.filter(t => t.status === status).map((task) => (
                <div 
                  key={task.id}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${PRIORITY_CONFIG[task.priority].color}`}>
                      {PRIORITY_CONFIG[task.priority].label}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canManage && (
                        <>
                          <button 
                            onClick={() => {
                              setEditingTask(task);
                              setIsModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-50 text-slate-400 hover:text-sky-600 rounded-lg"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => { if(confirm('Supprimer cette tâche ?')) deleteTaskMutation.mutate(task.id) }}
                            className="p-1 hover:bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <h4 className="font-medium text-slate-800 text-sm mb-2">{task.title}</h4>
                  
                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <UserIcon className="w-3 h-3" />
                      <span className="text-[10px] font-medium truncate max-w-[80px]">
                        {task.assigneeName || 'Non assigné'}
                      </span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] font-medium">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions for everyone */}
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {status !== 'in_progress' && status !== 'completed' && (
                      <button 
                        onClick={() => handleStatusChange(task, 'in_progress')}
                        className="text-[9px] font-bold px-2 py-1 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors whitespace-nowrap"
                      >
                        Démarrer
                      </button>
                    )}
                    {status !== 'completed' && (
                      <button 
                        onClick={() => handleStatusChange(task, 'completed')}
                        className="text-[9px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
                      >
                        Terminer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Titre</label>
                <input 
                  name="title"
                  defaultValue={editingTask?.title}
                  required
                  placeholder="Ex: Réviser le contrat de M. Smith"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  name="description"
                  defaultValue={editingTask?.description || ''}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Assigné à</label>
                  <select 
                    name="assignedTo"
                    defaultValue={editingTask?.assignedTo || ''}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  >
                    <option value="">Non assigné</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Priorité</label>
                  <select 
                    name="priority"
                    defaultValue={editingTask?.priority || 'medium'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Date d'échéance</label>
                <input 
                  name="dueDate"
                  type="date"
                  defaultValue={editingTask?.dueDate?.split('T')[0] || ''}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-md shadow-sky-100 flex items-center justify-center gap-2"
                >
                  {(createTaskMutation.isPending || updateTaskMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTask ? 'Mettre à jour' : 'Créer la tâche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
