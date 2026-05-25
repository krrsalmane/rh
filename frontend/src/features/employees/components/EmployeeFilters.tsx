import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDepartments } from '../hooks/useEmployees';
import type { EmployeeFilters as Filters } from '../types';

interface Props {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalCount?: number;
}

export const EmployeeFilters: React.FC<Props> = ({ filters, onFiltersChange, totalCount }) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const { data: departments = [] } = useDepartments();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        onFiltersChange({ ...filters, search: searchInput || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const hasActiveFilters = filters.search || filters.department || filters.status || filters.contractType;

  const clearAllFilters = () => {
    setSearchInput('');
    onFiltersChange({ page: 1, limit: filters.limit });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher par nom, email, CIN..."
            className="form-input pl-10"
            id="employee-search-input"
          />
        </div>

        {/* Department */}
        <select
          value={filters.department || ''}
          onChange={(e) => onFiltersChange({ ...filters, department: e.target.value || undefined, page: 1 })}
          className="form-input w-auto min-w-[160px]"
          id="employee-department-filter"
        >
          <option value="">Département</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status || ''}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined, page: 1 })}
          className="form-input w-auto min-w-[140px]"
          id="employee-status-filter"
        >
          <option value="">Statut</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="terminated">Résilié</option>
        </select>

        {/* Contract Type */}
        <select
          value={filters.contractType || ''}
          onChange={(e) => onFiltersChange({ ...filters, contractType: e.target.value || undefined, page: 1 })}
          className="form-input w-auto min-w-[140px]"
          id="employee-contract-filter"
        >
          <option value="">Contrat</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="internship">Stage</option>
          <option value="freelance">Freelance</option>
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-rose-500 transition-colors"
            id="employee-clear-filters"
          >
            <X className="w-4 h-4" />
            Effacer
          </button>
        )}
      </div>
    </div>
  );
};
