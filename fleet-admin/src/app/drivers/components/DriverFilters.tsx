import { Activity, CheckCircle, Navigation, CloudOff } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';

interface DriverFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  filteredCount: number;
}

export function DriverFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  filteredCount
}: DriverFiltersProps) {
  return (
    <section className="card flex flex-col md:flex-row justify-between items-center px-xl py-lg gap-xl mb-xl shadow-glow border-primary/10 transition-all duration-300 hover:border-primary/30 hover:shadow-glow-lg">
      <SearchInput
        placeholder="Search by name, email or phone..."
        value={searchQuery}
        className="w-full md:flex-1 md:max-w-[480px]"
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className="flex items-center gap-lg w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-md">
          <Select
            options={[
              { label: 'All Status', value: 'all', icon: <Activity size={14} /> },
              { label: 'Available', value: 'available', icon: <CheckCircle size={14} className="text-success" /> },
              { label: 'On Trip', value: 'on_trip', icon: <Navigation size={14} className="text-primary" /> },
              { label: 'Offline', value: 'offline', icon: <CloudOff size={14} className="text-dim" /> },
            ]}
            value={statusFilter}
            onChange={onStatusChange}
            className="min-w-[150px]"
          />
        </div>
        <div className="hidden md:block w-px h-8 bg-border" />
        <span className="text-xs text-dim font-medium">Total <b className="text-text">{filteredCount}</b> drivers</span>
      </div>
    </section>
  );
}
