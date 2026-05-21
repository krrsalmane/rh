import React, { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { Modal } from '@/shared/components/forms';

interface Props {
  email: string;
  password: string;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<Props> = ({ email, password, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Mot de passe réinitialisé"
      footer={
        <button type="button" className="btn-primary" onClick={onClose}>
          Fermer
        </button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[#374151]">
          Le nouveau mot de passe temporaire pour{' '}
          <span className="font-semibold text-[#1A1A2E]">{email}</span> est :
        </p>

        <div className="flex items-center gap-2 rounded-md border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-2">
          <code className="flex-1 select-all font-mono text-sm font-semibold tracking-wide text-[#1A1A2E]">
            {password}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="btn-icon"
            title="Copier"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-xs text-amber-700">
            L'utilisateur devra changer ce mot de passe à sa prochaine connexion.
          </p>
        </div>
      </div>
    </Modal>
  );
};
