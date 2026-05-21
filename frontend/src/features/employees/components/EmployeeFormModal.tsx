import React from 'react';
import { Modal } from '@/shared/components/forms';
import { EmployeeForm } from './EmployeeForm';
import type { Employee, CreateEmployeeDto } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  onSubmit: (data: CreateEmployeeDto) => void;
  isSubmitting: boolean;
}

export const EmployeeFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employee,
  onSubmit,
  isSubmitting,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={employee ? `Modifier ${employee.firstName} ${employee.lastName}` : 'Nouvel employé'}
    size="large"
    id="employee-modal"
  >
    <EmployeeForm
      key={employee?.id ?? 'new'}
      employee={employee}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      onCancel={onClose}
    />
  </Modal>
);
