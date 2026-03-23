import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useDocuments, useArchiveDocument, useDeleteDocument } from '../hooks/useDocuments';
import { DocumentList } from '../components/DocumentList';
import type { GeneratedDocument, DocumentFilters } from '../types';
import { ROUTES } from '@/shared/constants/routes';
import axios from '@/shared/api/axiosInstance';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DocumentFilters>({ page: 1, limit: 20 });
  const { data, isLoading } = useDocuments(filters);
  const archiveMutation = useArchiveDocument();
  const deleteMutation = useDeleteDocument();

  const handleDownload = async (doc: GeneratedDocument) => {
    try {
      const res = await axios.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.templateName || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* handled */ }
  };

  const handleArchive = (doc: GeneratedDocument) => archiveMutation.mutate(doc.id);
  const handleDelete = (doc: GeneratedDocument) => {
    if (window.confirm('Supprimer ce document ?')) deleteMutation.mutate(doc.id);
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="documents-page">
      {/* Secondary Header / Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Historique des documents</h2>
          {data?.pagination && (
            <p className="text-xs text-slate-400 mt-1">
              {data.pagination.total} document{data.pagination.total !== 1 ? 's' : ''} généré{data.pagination.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/documents/generate')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:-translate-y-0.5"
          id="generate-doc-btn"
        >
          <Zap className="w-3.5 h-3.5" /> Générer un document
        </button>
      </div>

      {/* Document List */}
      <DocumentList
        documents={data?.data || []}
        isLoading={isLoading}
        onPreview={(doc) => navigate(ROUTES.DOCUMENT_VIEW.replace(':id', doc.id))}
        onDownload={handleDownload}
        onArchive={handleArchive}
        onDelete={handleDelete}
        pagination={data?.pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
};
