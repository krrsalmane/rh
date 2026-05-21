import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTemplates, usePatchTemplateStatus, useDeleteTemplate } from '../hooks/useTemplates';
import { TemplateList } from '../components/TemplateList';
import type { Template, TemplateFilters } from '../types';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TemplateFilters>({ page: 1, limit: 50 });
  const { data, isLoading } = useTemplates(filters);
  const statusMutation = usePatchTemplateStatus();
  const deleteMutation = useDeleteTemplate();

  const handleEdit = (tpl: Template) => navigate(`/templates/${tpl.id}`);
  const handleGenerate = (tpl: Template) => navigate(`/documents/generate?templateId=${tpl.id}`);
  const handleStatusChange = (tpl: Template, status: 'active' | 'archived' | 'draft') => {
    statusMutation.mutate({ id: tpl.id, status });
  };
  const handleDelete = (tpl: Template) => {
    deleteMutation.mutate({ id: tpl.id });
  };

  return (
    <div className="space-y-6 animate-fade-in px-8 py-6 h-full flex flex-col" id="templates-page">
      {/* Header Row */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Modèles de documents</h1>
          <p className="text-sm text-slate-500 mt-1">Créez et gérez vos modèles de documents professionnels</p>
        </div>
        <button onClick={() => navigate('/templates/new')} className="btn-primary" id="new-template-btn">
          <Plus className="w-4 h-4" />
          Nouveau modèle
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between mt-8 p-1">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Rechercher un modèle..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-72 h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
            />
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* Category */}
          <select
            value={filters.category || ''}
            onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined, page: 1 })}
            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-slate-400 cursor-pointer transition-all"
          >
            <option value="">Toutes catégories</option>
            <option value="contract">Contrats</option>
            <option value="attestation">Attestations</option>
            <option value="letter">Lettres</option>
            <option value="custom">Personnalisés</option>
          </select>

          {/* Status */}
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-slate-400 cursor-pointer transition-all"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="draft">Brouillon</option>
            <option value="archived">Archivé</option>
          </select>
        </div>

        <div className="text-sm font-medium text-slate-400 bg-slate-100/50 px-3 py-1 rounded-full border border-slate-100">
          {data?.pagination?.total || 0} modèles
        </div>
      </div>

      <div className="border-b border-slate-100 pb-2" />

      {/* Template List */}
      <TemplateList
        templates={data?.data || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onGenerate={handleGenerate}
        isDeleting={deleteMutation.isPending}
      />

      {/* Pagination Footer */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 px-1">
          <p className="text-sm text-slate-500">
            Affichage de <span className="font-semibold text-slate-900">{((filters.page || 1) - 1) * (filters.limit || 20) + 1}</span> à <span className="font-semibold text-slate-900">{Math.min((filters.page || 1) * (filters.limit || 20), data.pagination.total)}</span> sur <span className="font-semibold text-slate-900">{data.pagination.total}</span> modèles
          </p>
          <div className="flex gap-2">
            <button 
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>
            <button 
              disabled={filters.page === data.pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
