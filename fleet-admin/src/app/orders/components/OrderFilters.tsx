import React from 'react';
import { 
  Filter, 
  Activity, 
  Clock as ClockIcon, 
  UserCheck, 
  Navigation, 
  CheckCircle, 
  XCircle, 
  Slash 
} from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  totalCount: number;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
}) => {
  return (
    <section className="card flex flex-col md:flex-row justify-between items-center px-xl py-lg gap-xl shadow-glow border-primary/10">
      <SearchInput
        placeholder="Search by ID or address..."
        value={searchQuery}
        className="flex-1 w-full max-w-[480px]"
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className="flex items-center gap-lg w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-2 mr-2 text-text-dim whitespace-nowrap">
            <Filter size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
          </div>
          <Select
            options={[
              { label: 'All Status', value: 'all', icon: <Activity size={14} /> },
              { label: 'Pending', value: 'pending', icon: <ClockIcon size={14} className="text-warning" /> },
              { label: 'Assigned', value: 'assigned', icon: <UserCheck size={14} className="text-success" /> },
              { label: 'Delivering', value: 'delivering', icon: <Navigation size={14} className="text-primary" /> },
              { label: 'Delivered', value: 'delivered', icon: <CheckCircle size={14} className="text-success" /> },
              { label: 'Failed', value: 'failed', icon: <XCircle size={14} className="text-danger" /> },
              { label: 'Cancelled', value: 'cancelled', icon: <Slash size={14} className="text-dim" /> },
            ]}
            value={statusFilter}
            onChange={onStatusFilterChange}
            className="min-w-[160px]"
          />
        </div>
        <div className="hidden md:block w-px h-8 bg-border mx-1" />
        <span className="text-xs text-dim font-medium whitespace-nowrap">
          Total <b className="text-text">{totalCount}</b> orders
        </span>
      </div>
    </section>
  );
};
