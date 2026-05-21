import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, FormField, FormInput, FormFooter } from '@/shared/components/forms';
import type { User } from '../types';

interface Props {
  user: User;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteUserConfirm: React.FC<Props> = ({ user, onConfirm, onClose }) => {
  const [typed, setTyped] = useState('');
  const matches = typed === user.email;

  return (
    <Modal isOpen onClose={onClose} title="Supprimer l'utilisateur">
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-[#374151]">
            Cette action est <span className="font-semibold text-red-600">irréversible</span>. L'utilisateur{' '}
            <span className="font-semibold text-[#1A1A2E]">{user.email}</span> sera définitivement supprimé.
          </p>
        </div>

        <FormField label={`Tapez ${user.email} pour confirmer`} required>
          <FormInput
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={user.email}
            autoFocus
          />
        </FormField>

        <FormFooter
          onCancel={onClose}
          submitText="Supprimer"
          submitType="button"
          onSubmit={onConfirm}
          disabled={!matches}
          variant="danger"
        />
      </div>
    </Modal>
  );
};
