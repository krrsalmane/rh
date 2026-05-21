import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Loader2, FileText, AlertCircle, Printer } from 'lucide-react';
import { useDocument } from '../hooks/useDocuments';
import axios from '@/shared/api/axiosInstance';
import { cn } from '@/shared/utils/cn';

export const DocumentViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: document, isLoading: isDocLoading, isError } = useDocument(id);
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setIsPdfLoading(true);
      axios.get(`/documents/${id}/pdf`, { responseType: 'blob' })
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
          setPdfUrl(url);
        })
        .catch(() => setPdfUrl(null))
        .finally(() => setIsPdfLoading(false));
    }
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [id]);

  const handleDownload = async () => {
    if (!id || !document) return;
    try {
      const res = await axios.get(`/documents/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.templateName || 'document'}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* toast error could be added here */ }
  };

  const handlePrint = () => {
    const iframe = window.document.getElementById('pdf-frame') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  if (isDocLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
        <p className="text-slate-500 font-medium">Chargement du document...</p>
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Document introuvable</h2>
        <p className="text-slate-500 max-w-sm">Le document que vous recherchez n'existe pas ou vous n'avez pas les droits nécessaires.</p>
        <button 
          onClick={() => navigate('/documents')}
          className="mt-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-900 -m-8 relative">
      {/* Top Header - Dark theme like the screenshot */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/documents')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-slate-800 mx-1" />
          
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-800 text-sky-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-200 leading-tight">
                {document.templateName || 'Document'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  #{document.id.slice(0, 8)}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter",
                  document.status === 'generated' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                )}>
                  {document.status === 'generated' ? 'Généré' : document.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-icon" title="Imprimer">
            <Printer className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-2" />
          <button onClick={handleDownload} className="btn-primary text-xs">
            <Download className="w-3.5 h-3.5" /> Télécharger
          </button>
        </div>
      </div>

      {/* Main Preview Area - Full Page */}
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
        {isPdfLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 z-20">
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
            <p className="text-sm font-medium text-slate-400">Génération de l'aperçu...</p>
          </div>
        ) : pdfUrl ? (
          <iframe 
            id="pdf-frame"
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`} 
            className="w-full h-full border-none bg-white" 
            title="Aperçu du Document"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 gap-4 text-slate-600">
            <AlertCircle className="w-12 h-12 opacity-20" />
            <p className="font-medium">Échec du chargement de l'aperçu PDF</p>
          </div>
        )}
      </div>
    </div>
  );
};
