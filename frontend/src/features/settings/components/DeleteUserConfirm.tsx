import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Supprimer l'utilisateur
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Cette action est <span className="font-semibold text-red-600">irréversible</span>. L'utilisateur{' '}
            <span className="font-semibold text-gray-800">{user.email}</span> sera définitivement supprimé.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tapez <span className="font-mono text-red-600 bg-red-50 px-1 rounded">{user.email}</span> pour confirmer
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={user.email}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={!matches}
              className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:bg-red-200 disabled:cursor-not-allowed transition-all shadow-md shadow-red-500/20"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
