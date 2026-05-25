import React, { useState } from 'react';
import { FileSignature, FileCheck, Mail, File, Pencil, Trash2, Eye, FileText, Archive, RotateCcw } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { TemplatePreviewDrawer } from './TemplatePreviewDrawer';
import { useDeleteTemplate } from '../hooks/useTemplates';
import type { Template } from '../types';
import { cn } from '@/shared/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  templates: Template[];
  isLoading: boolean;
  onEdit: (template: Template) => void;
  onDelete?: (template: Template) => void;
  onStatusChange: (template: Template, status: 'active' | 'archived' | 'draft') => void;
  onGenerate: (template: Template) => void;
  isDeleting?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  contract: FileSignature,
  attestation: FileCheck,
  letter: Mail,
  custom: File,
};

const categoryLabels: Record<string, string> = {
  contract: 'Contrat',
  attestation: 'Attestation',
  letter: 'Lettre',
  custom: 'Personnalisé',
};

const categoryClasses: Record<string, string> = {
  contract: 'bg-blue-50 text-blue-700 font-medium',
  attestation: 'bg-green-50 text-green-700 font-medium',
  letter: 'bg-purple-50 text-purple-700 font-medium',
  custom: 'bg-slate-100 text-slate-600 font-medium',
};

const langFlags: Record<string, React.ReactNode> = {
  fr: (
    <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shadow-sm inline-block mr-1.5">
      <rect width="3" height="2" fill="#ED2939"/>
      <rect width="2" height="2" fill="#fff"/>
      <rect width="1" height="2" fill="#002395"/>
    </svg>
  ),
  ar: (
    <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shadow-sm inline-block mr-1.5">
      <rect width="3" height="2" fill="#c1272d"/>
      <circle cx="1.5" cy="1" r="0.4" fill="#006233"/>
    </svg>
  ), // Using a simplified Morocco flag
  en: (
    <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shadow-sm inline-block mr-1.5">
      <rect width="3" height="2" fill="#00247d"/>
      <path d="M0,0 L3,2 M3,0 L0,2" stroke="#fff" strokeWidth="0.6"/>
      <path d="M0,0 L3,2 M3,0 L0,2" stroke="#cf142b" strokeWidth="0.4"/>
      <path d="M1.5,0 L1.5,2 M0,1 L3,1" stroke="#fff" strokeWidth="1"/>
      <path d="M1.5,0 L1.5,2 M0,1 L3,1" stroke="#cf142b" strokeWidth="0.6"/>
    </svg>
  ), // Union Jack simplified
  de: (
    <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shadow-sm inline-block mr-1.5">
      <rect width="3" height="2" fill="#FFCE00"/>
      <rect width="3" height="1.33" fill="#DD0000"/>
      <rect width="3" height="0.66" fill="#000"/>
    </svg>
  ),
};

export const TemplateList: React.FC<Props> = ({
  templates, isLoading, onEdit, onStatusChange, onGenerate
}) => {
  const userRole = useAppSelector((s) => s.auth.role);
  const isSuperAdmin = userRole === 'super_admin';
  const isHrAgent = userRole === 'hr_agent';
  const canDelete = isSuperAdmin || isHrAgent;

  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const deleteTemplate = useDeleteTemplate();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-white border border-slate-100 rounded-lg animate-pulse flex items-center px-4 gap-4">
            <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-3 bg-slate-100 rounded w-1/6" />
            </div>
            <div className="h-4 bg-slate-100 rounded w-24" />
            <div className="h-4 bg-slate-100 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
        <FileText className="w-12 h-12 text-slate-200 mb-3" />
        <h3 className="text-slate-500 font-medium">Aucun modèle trouvé</h3>
        <p className="text-slate-400 text-sm mt-1">Créez votre premier modèle de document</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="flex items-center px-4 py-3 bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex-1">Modèle</div>
        <div className="w-40 flex-shrink-0">Catégorie</div>
        <div className="w-20 flex-shrink-0">Langue</div>
        <div className="w-36 flex-shrink-0 text-center">Statut</div>
        <div className="w-32 flex-shrink-0">Utilisation</div>
        <div className="w-36 flex-shrink-0">Dernière MAJ</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100">
        {templates.map((tpl) => {
          const Icon = categoryIcons[tpl.category] || FileText;
          const iconColor = tpl.category === 'contract' ? 'text-blue-600' : 
                           tpl.category === 'attestation' ? 'text-green-600' :
                           tpl.category === 'letter' ? 'text-purple-600' : 'text-slate-600';
          const iconBg = tpl.category === 'contract' ? 'bg-blue-50' : 
                        tpl.category === 'attestation' ? 'bg-green-50' :
                        tpl.category === 'letter' ? 'bg-purple-50' : 'bg-slate-100';

          return (
            <div 
              key={tpl.id}
              onClick={() => setPreviewTemplate(tpl)}
              className="flex items-center px-4 h-16 hover:bg-slate-50 transition-all cursor-pointer group relative"
            >
              {/* MODÈLE */}
              <div className="flex-1 flex items-center min-w-0 pr-4">
                <div className={cn("w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0", iconBg)}>
                  <Icon className={cn("w-5 h-5", iconColor)} />
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{tpl.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">v{tpl.version}</p>
                </div>
              </div>

              {/* CATÉGORIE */}
              <div className="w-40 flex-shrink-0">
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px]", categoryClasses[tpl.category])}>
                  {categoryLabels[tpl.category]}
                </span>
              </div>

              {/* LANGUE */}
              <div className="w-20 flex-shrink-0 text-sm text-slate-600 flex items-center font-medium">
                {langFlags[tpl.language]}
                <span className="text-[11px] font-bold">{tpl.language.toUpperCase()}</span>
              </div>

              {/* STATUT */}
              <div className="w-36 flex-shrink-0 flex justify-center">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50/50 border border-slate-100">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    tpl.status === 'active' ? 'bg-green-500' : 
                    tpl.status === 'draft' ? 'bg-amber-500' : 'bg-slate-400'
                  )} />
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-tight",
                    tpl.status === 'active' ? 'text-green-700' : 
                    tpl.status === 'draft' ? 'text-amber-700' : 'text-slate-500'
                  )}>
                    {tpl.status === 'active' ? 'Actif' : tpl.status === 'draft' ? 'Brouillon' : 'Archivé'}
                  </span>
                </div>
              </div>

              {/* UTILISATION */}
              <div className="w-32 flex-shrink-0 text-xs font-medium text-slate-500">
                {tpl.usageCount > 0 ? `${tpl.usageCount} fois` : 'Jamais'}
              </div>

              {/* DERNIÈRE MAJ */}
              <div className="w-36 flex-shrink-0 text-xs text-slate-400">
                {formatDistanceToNow(new Date(tpl.createdAt), { addSuffix: true, locale: fr })}
              </div>

              {/* ACTIONS (Overlay on hover) */}
              <div className="absolute right-0 top-0 bottom-0 pr-4 pl-12 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-l from-slate-50 via-slate-50 to-transparent">
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewTemplate(tpl); }}
                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
                  title="Aperçu"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(tpl); }}
                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {tpl.status === 'active' ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(tpl, 'archived'); }}
                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
                    title="Archiver"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(tpl, 'active'); }}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
                    title="Activer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTemplate.mutate({ id: tpl.id, force: tpl.usageCount > 0 }); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onGenerate(tpl); }}
                  className="ml-1 px-3 py-1.5 text-[10px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                >
                  Utiliser
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Side Panel */}
      <TemplatePreviewDrawer
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onEdit={onEdit}
        onGenerate={onGenerate}
      />
    </div>
  );
};
