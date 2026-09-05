import React, { createContext, useContext, useState, useEffect } from 'react';
import { FilterState, FilterOptions } from '../types';
import { api } from '../services/api';

const initialFilters: FilterState = {
  start_date: '',
  end_date: '',
  production_line: 'All Lines',
  event: 'All Events',
  status: 'All',
  invalid_reason: 'All Reasons',
};

const initialOptions: FilterOptions = {
  production_lines: [],
  events: [],
  statuses: ['All', 'Valid', 'Invalid'],
  invalid_reasons: [],
  date_range: { min_date: null, max_date: null },
};

interface FilterContextType {
  filters: FilterState;
  appliedFilters: FilterState;
  options: FilterOptions;
  lastUpdated: string;
  updateFilter: (key: keyof FilterState, val: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  refresh: () => void;
  refreshTrigger: number;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [options, setOptions] = useState<FilterOptions>(initialOptions);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const fetchOptions = async () => {
    try {
      const opts = await api.getFilterOptions();
      setOptions(opts);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [refreshTrigger]);

  const updateFilter = (key: keyof FilterState, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const apply = () => {
    setAppliedFilters({ ...filters });
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const reset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  return (
    <FilterContext.Provider value={{
      filters,
      appliedFilters,
      options,
      lastUpdated,
      updateFilter,
      applyFilters: apply,
      resetFilters: reset,
      refresh,
      refreshTrigger
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
};
