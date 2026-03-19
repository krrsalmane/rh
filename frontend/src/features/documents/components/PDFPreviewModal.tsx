import React, { useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import axios from '@/shared/api/axiosInstance';

interface Props {
  isOpen: boolean;
  documentId: string | null;
  documentName?: string;
  onClose: () => void;
}

export const PDFPreviewModal: React.FC<Props> = ({ isOpen, documentId, documentName, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      axios.get(`/documents/${documentId}/pdf`, { responseType: 'blob' })
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
          setPdfUrl(url);
        })
        .catch(() => setPdfUrl(null))
        .finally(() => setLoading(false));
    }
    return () => {
      if (pdfUrl) { window.URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
    };
  }, [isOpen, documentId]);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !documentId) return null;

  const handleDownload = async () => {
    try {
      const res = await axios.get(`/documents/${documentId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* handled */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-fade-in-up" id="pdf-preview-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{documentName || 'Aperçu PDF'}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" /> Télécharger
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full min-h-[500px]">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            </div>
          )}
          {!loading && pdfUrl && (
            <iframe src={pdfUrl} className="w-full h-full min-h-[500px]" title="PDF Preview" />
          )}
          {!loading && !pdfUrl && (
            <div className="flex items-center justify-center h-full min-h-[500px] text-slate-400">
              Impossible de charger le PDF
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
