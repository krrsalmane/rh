import React from 'react';
import { Navigate } from 'react-router-dom';

// Create is handled via modal in EmployeesListPage, redirect there
export const EmployeeCreatePage: React.FC = () => {
  return <Navigate to="/employees" replace />;
};
