import React, { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import axios from '@/shared/api/axiosInstance';
import { Modal } from '@/shared/components/forms';

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
      axios
        .get(`/documents/${documentId}/pdf`, { responseType: 'blob' })
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
          setPdfUrl(url);
        })
        .catch(() => setPdfUrl(null))
        .finally(() => setLoading(false));
    }
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [isOpen, documentId]);

  if (!documentId) return null;

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
    } catch {
      /* handled */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentName || 'Aperçu PDF'}
      size="wide"
      id="pdf-preview-modal"
      footer={
        <>
          <button type="button" className="btn-form-cancel" onClick={onClose}>
            Fermer
          </button>
          <button type="button" className="btn-primary" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Télécharger
          </button>
        </>
      }
    >
      <div className="min-h-[400px] overflow-hidden rounded-md border border-[#E5E7EB]">
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
          </div>
        )}
        {!loading && pdfUrl && (
          <iframe src={pdfUrl} className="h-[min(70vh,600px)] w-full" title="PDF Preview" />
        )}
        {!loading && !pdfUrl && (
          <div className="flex min-h-[400px] items-center justify-center text-[#9CA3AF]">
            Impossible de charger le PDF
          </div>
        )}
      </div>
    </Modal>
  );
};
