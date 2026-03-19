import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTemplate, useCreateTemplate, useUpdateTemplate } from '../hooks/useDocuments';
import { TemplateBuilder } from '../components/TemplateBuilder';
import type { CreateTemplateDto } from '../types';

export const TemplateEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const { data: template, isLoading } = useTemplate(isNew ? undefined : id);
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();

  const handleSave = (data: CreateTemplateDto) => {
    if (isNew) {
      createMutation.mutate(data, { onSuccess: () => navigate('/templates') });
    } else {
      updateMutation.mutate({ id: id!, data }, { onSuccess: () => navigate('/templates') });
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up" id="template-editor-page">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/templates')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux modèles
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          {isNew ? 'Nouveau modèle' : `Modifier: ${template?.name || ''}`}
        </h1>
      </div>

      <TemplateBuilder
        template={isNew ? undefined : template}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};
