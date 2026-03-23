import React, { useState } from 'react';
import { FileText, FileSignature, Mail, Settings, Pencil, Trash2, Archive, RotateCcw, Zap, Eye } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import type { Template } from '../types';

interface Props {
  templates: Template[];
  isLoading: boolean;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  onStatusChange: (template: Template, status: 'active' | 'archived') => void;
  onGenerate: (template: Template) => void;
  isDeleting?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  contract: FileSignature,
  attestation: FileText,
  letter: Mail,
  custom: Settings,
};
const categoryLabels: Record<string, string> = {
  contract: 'Contrat', attestation: 'Attestation', letter: 'Lettre', custom: 'Personnalisé',
};
const categoryColors: Record<string, string> = {
  contract: 'bg-blue-50 text-blue-700 border-blue-200',
  attestation: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  letter: 'bg-purple-50 text-purple-700 border-purple-200',
  custom: 'bg-slate-100 text-slate-600 border-slate-200',
};
const langLabels: Record<string, string> = { fr: 'FR', ar: 'AR', en: 'EN', de: 'DE' };
const statusLabels: Record<string, string> = { active: 'Actif', draft: 'Brouillon', archived: 'Archivé' };
const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const TemplateList: React.FC<Props> = ({ 
  templates, isLoading, onEdit, onDelete, onStatusChange, onGenerate, isDeleting = false 
}) => {
  const userRole = useAppSelector((s) => s.auth.role);
  const isSuperAdmin = userRole === 'super_admin';
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
            <div className="h-5 bg-slate-100 rounded w-2/3 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucun modèle</h3>
        <p className="text-sm text-slate-400">Créez votre premier modèle de document.</p>
      </div>
    );
  }

  const selectedForDelete = templates.find(t => t.id === deleteId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="templates-grid">
      {templates.map((tpl) => {
        const Icon = categoryIcons[tpl.category] || FileText;
        return (
          <div key={tpl.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group" id={`template-card-${tpl.id}`}>
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 truncate">{tpl.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryColors[tpl.category]}`}>
                    {categoryLabels[tpl.category]}
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{langLabels[tpl.language]}</span>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>v{tpl.version}</span>
              <span>Utilisé {tpl.usageCount} fois</span>
            </div>

            {/* Status badge */}
            <div className="mb-4">
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[tpl.status]}`}>
                {statusLabels[tpl.status]}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
              {tpl.status === 'active' && (
                <button
                  onClick={() => onGenerate(tpl)}
                  className="mr-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-sm"
                  id={`template-use-${tpl.id}`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Utiliser
                </button>
              )}
              
              <div className="flex items-center gap-0.5 ml-auto">
                <button
                  onClick={() => setPreviewTemplate(tpl)}
                  className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                  title="Aperçu"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(tpl)}
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  title="Modifier"
                  id={`template-edit-${tpl.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {tpl.status === 'active' && (
                  <button
                    onClick={() => onStatusChange(tpl, 'archived')}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Archiver"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                {tpl.status === 'archived' && (
                  <button
                    onClick={() => onStatusChange(tpl, 'active')}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Réactiver"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                {isSuperAdmin && tpl.status === 'draft' && (
                  <button
                    onClick={() => setDeleteId(tpl.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (selectedForDelete) {
            onDelete(selectedForDelete);
            setDeleteId(null);
          }
        }}
        title="Supprimer le modèle"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedForDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
};
