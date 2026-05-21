import React from 'react';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { Employee } from '../types';

interface Props {
  isOpen: boolean;
  employee: Employee | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteEmployeeConfirm: React.FC<Props> = ({
  isOpen,
  employee,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  if (!employee) return null;

  const name = `${employee.firstName} ${employee.lastName}`;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Supprimer l'employé"
      message={
        <>
          Êtes-vous sûr de vouloir supprimer <strong>{name}</strong> ? Cette action est irréversible.
        </>
      }
      confirmText="Supprimer"
      variant="danger"
      isLoading={isDeleting}
    />
  );
};
