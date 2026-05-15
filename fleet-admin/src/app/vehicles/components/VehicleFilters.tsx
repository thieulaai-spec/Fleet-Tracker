'use client';

import React from 'react';
import { 
  Filter, 
  LayoutGrid, 
  Box, 
  Truck, 
  Container, 
  Activity, 
  Zap, 
  Navigation, 
  ShieldAlert 
} from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';

interface VehicleFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  total: number;
}

export function VehicleFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  total
}: VehicleFiltersProps) {
  return (
    <section className="flex flex-col md:flex-row justify-between items-center gap-lg p-lg bg-surface rounded-xl border border-border">
      <div className="w-full md:flex-1 md:max-w-[400px]">
        <SearchInput
          placeholder="Search by plate number or driver..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 mr-2 text-text-dim">
          <Filter size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>
        <Select
          options={[
            { label: 'All Types', value: 'all', icon: <LayoutGrid size={14} /> },
            { label: 'Small', value: 'small', icon: <Box size={14} /> },
            { label: 'Medium', value: 'medium', icon: <Truck size={14} /> },
            { label: 'Large', value: 'large', icon: <Container size={14} /> },
          ]}
          value={typeFilter}
          onChange={onTypeFilterChange}
          className="min-w-[140px]"
        />
        <Select
          options={[
            { label: 'All Status', value: 'all', icon: <Activity size={14} /> },
            { label: 'Available', value: 'available', icon: <Zap size={14} className="text-success" /> },
            { label: 'Delivering', value: 'delivering', icon: <Navigation size={14} className="text-primary" /> },
            { label: 'Maintenance', value: 'maintenance', icon: <ShieldAlert size={14} className="text-warning" /> },
          ]}
          value={statusFilter}
          onChange={onStatusFilterChange}
          className="min-w-[140px]"
        />
        <div className="hidden md:block w-px h-6 bg-border mx-1" />
        <span className="text-xs font-medium text-text-dim whitespace-nowrap">Total <b>{total}</b> vehicles</span>
      </div>
    </section>
  );
}
