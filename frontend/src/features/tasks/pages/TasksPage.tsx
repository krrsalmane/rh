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
import {
  Modal,
  FormCard,
  FormField,
  FormGrid,
  FormInput,
  FormSelect,
  FormTextarea,
  FormFooter,
} from '@/shared/components/forms';

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
          <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="btn-primary">
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
      >
        <form onSubmit={handleCreateOrUpdate}>
          <FormCard title="Détails">
            <FormField label="Titre" required>
              <FormInput
                name="title"
                defaultValue={editingTask?.title}
                required
                placeholder="Ex: Réviser le contrat de M. Smith"
              />
            </FormField>
            <FormField label="Description">
              <FormTextarea
                name="description"
                defaultValue={editingTask?.description || ''}
                rows={3}
              />
            </FormField>
            <FormGrid>
              <FormField label="Assigné à">
                <FormSelect name="assignedTo" defaultValue={editingTask?.assignedTo || ''}>
                  <option value="">Non assigné</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Priorité">
                <FormSelect name="priority" defaultValue={editingTask?.priority || 'medium'}>
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgent</option>
                </FormSelect>
              </FormField>
            </FormGrid>
            <FormField label="Date d'échéance">
              <FormInput
                name="dueDate"
                type="date"
                defaultValue={editingTask?.dueDate?.split('T')[0] || ''}
              />
            </FormField>
          </FormCard>
          <FormFooter
            onCancel={() => setIsModalOpen(false)}
            submitText={editingTask ? 'Mettre à jour' : 'Créer la tâche'}
            isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
          />
        </form>
      </Modal>
    </div>
  );
};
