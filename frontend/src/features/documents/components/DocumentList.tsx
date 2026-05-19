import React from 'react';
import { FileText, Download, Eye, Archive, Trash2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import type { GeneratedDocument } from '../types';

interface Props {
  documents: GeneratedDocument[];
  isLoading: boolean;
  onPreview: (doc: GeneratedDocument) => void;
  onDownload: (doc: GeneratedDocument) => void;
  onArchive: (doc: GeneratedDocument) => void;
  onDelete: (doc: GeneratedDocument) => void;
  pagination?: { total: number; page: number; limit: number; totalPages: number };
  onPageChange?: (page: number) => void;
}

const statusLabels: Record<string, string> = { generated: 'Généré', archived: 'Archivé', deleted: 'Supprimé' };
const statusColors: Record<string, string> = {
  generated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
  deleted: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatDate(dateStr: string) {
  try { 
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false  // Force 24-hour format (23:59, not 11:59 PM)
    }); 
  }
  catch { return '—'; }
}

export const DocumentList: React.FC<Props> = ({ documents, isLoading, onPreview, onDownload, onArchive, onDelete, pagination, onPageChange }) => {
  const userRole = useAppSelector((s) => s.auth.role);
  const isSuperAdmin = userRole === 'super_admin';

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {['Document', 'Employé', 'Généré le', 'Par', 'Statut', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-50">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: '100px' }} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucun document généré</h3>
        <p className="text-sm text-slate-400">Générez votre premier document à partir d'un modèle.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden" id="documents-table">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employé</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Généré le</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Par</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-sky-50/40 transition-colors" id={`doc-row-${doc.id}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{doc.templateName || 'Document'}</p>
                      <p className="text-xs text-slate-400">v{doc.templateVersion}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{doc.employeeName || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatDate(doc.generatedAt)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{doc.generatedByEmail || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[doc.status]}`}>
                    {statusLabels[doc.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onPreview(doc)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Aperçu">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDownload(doc)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Télécharger">
                      <Download className="w-4 h-4" />
                    </button>
                    {doc.status === 'generated' && (
                      <button onClick={() => onArchive(doc)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Archiver">
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button onClick={() => onDelete(doc)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-sm text-slate-500">{pagination.total} document{pagination.total !== 1 ? 's' : ''}</p>
          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 py-1 text-slate-400">…</span>}
                  <button
                    onClick={() => onPageChange?.(p)}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${p === pagination.page ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};



