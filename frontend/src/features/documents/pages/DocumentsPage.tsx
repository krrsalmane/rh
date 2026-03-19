import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Zap } from 'lucide-react';
import { useDocuments, useArchiveDocument, useDeleteDocument } from '../hooks/useDocuments';
import { DocumentList } from '../components/DocumentList';
import { PDFPreviewModal } from '../components/PDFPreviewModal';
import type { GeneratedDocument, DocumentFilters } from '../types';
import axios from '@/shared/api/axiosInstance';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DocumentFilters>({ page: 1, limit: 20 });
  const { data, isLoading } = useDocuments(filters);
  const archiveMutation = useArchiveDocument();
  const deleteMutation = useDeleteDocument();

  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Documents générés</h1>
            {data?.pagination && <p className="text-sm text-slate-400">{data.pagination.total} document{data.pagination.total !== 1 ? 's' : ''}</p>}
          </div>
        </div>
        <button
          onClick={() => navigate('/documents/generate')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:-translate-y-0.5"
          id="generate-doc-btn"
        >
          <Zap className="w-4 h-4" /> Générer un document
        </button>
      </div>

      {/* Document List */}
      <DocumentList
        documents={data?.data || []}
        isLoading={isLoading}
        onPreview={setPreviewDoc}
        onDownload={handleDownload}
        onArchive={handleArchive}
        onDelete={handleDelete}
        pagination={data?.pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />

      {/* PDF Preview */}
      <PDFPreviewModal
        isOpen={!!previewDoc}
        documentId={previewDoc?.id || null}
        documentName={previewDoc?.templateName || undefined}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
};
