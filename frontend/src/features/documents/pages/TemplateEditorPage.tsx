import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { templatesApi } from '../api';
import { TemplateBuilder } from '../components/TemplateBuilder';
import type { Template } from '../types';

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  // Redirect /templates/:id to /templates/:id/edit if it's exactly the base path
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (id && id !== 'new' && !currentPath.endsWith('/edit')) {
      navigate(`/templates/${id}/edit`, { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!isNew && id) {
      console.log('TemplateEditorPage — Loading template:', id);
      templatesApi.getById(id)
        .then((data) => {
          console.log('TemplateEditorPage — Template loaded:', data.name);
          setTemplate(data);
        })
        .catch((err) => {
          console.error('TemplateEditorPage — Error loading template:', err);
          setError('Impossible de charger le modèle. Il a peut-être été supprimé.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Chargement du modèle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Erreur</h3>
        <p className="text-slate-500 mt-2 mb-6">{error}</p>
        <button
          onClick={() => navigate('/templates')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux modèles
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/templates')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none">
              {isNew ? 'Nouveau modèle' : template?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isNew ? 'Création d\'un nouveau document' : 'Modification du modèle existant'}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <TemplateBuilder
          template={template || undefined}
          onSave={() => navigate('/templates')}
          isSaving={false}
        />
      </div>
    </div>
  );
}
