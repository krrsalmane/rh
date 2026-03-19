import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { useTemplates, usePatchTemplateStatus, useDeleteTemplate } from '../hooks/useDocuments';
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
  const handleStatusChange = (tpl: Template, status: 'active' | 'archived') => {
    statusMutation.mutate({ id: tpl.id, status });
  };
  const handleDelete = (tpl: Template) => {
    if (window.confirm(`Supprimer le modèle "${tpl.name}" ?`)) {
      deleteMutation.mutate(tpl.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="templates-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Modèles de documents</h1>
            {data?.pagination && <p className="text-sm text-slate-400">{data.pagination.total} modèle{data.pagination.total !== 1 ? 's' : ''}</p>}
          </div>
        </div>
        <button
          onClick={() => navigate('/templates/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:-translate-y-0.5"
          id="new-template-btn"
        >
          <Plus className="w-4 h-4" /> Nouveau modèle
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.category || ''}
          onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined, page: 1 })}
          className="input-field w-auto min-w-[160px]"
        >
          <option value="">Toutes catégories</option>
          <option value="contract">Contrats</option>
          <option value="attestation">Attestations</option>
          <option value="letter">Lettres</option>
          <option value="custom">Personnalisés</option>
        </select>
        <select
          value={filters.language || ''}
          onChange={(e) => setFilters({ ...filters, language: e.target.value || undefined, page: 1 })}
          className="input-field w-auto min-w-[140px]"
        >
          <option value="">Toutes langues</option>
          <option value="fr">Français</option>
          <option value="ar">Arabe</option>
          <option value="en">Anglais</option>
          <option value="de">Allemand</option>
        </select>
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
          className="input-field w-auto min-w-[140px]"
        >
          <option value="">Tous statuts</option>
          <option value="active">Actif</option>
          <option value="draft">Brouillon</option>
          <option value="archived">Archivé</option>
        </select>
      </div>

      {/* Template Grid */}
      <TemplateList
        templates={data?.data || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onGenerate={handleGenerate}
      />
    </div>
  );
};
