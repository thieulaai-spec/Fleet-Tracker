'use client';

import React from 'react';
import { 
  Plus, 
  Filter, 
  User as UserIcon, 
  Edit2, 
  Trash2, 
  Phone,
  Star
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

import { useDrivers } from '@/hooks/use-drivers';
import { Driver } from '@/types';

// For typing the backend response which includes the joined user
interface DriverWithUser extends Driver {
  user?: { email: string };
}

export default function DriversPage() {
  const { drivers, isLoading, registerDriver, isRegistering } = useDrivers();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDriver, setSelectedDriver] = React.useState<DriverWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filteredDrivers = (drivers as DriverWithUser[]).filter(d => 
    d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone.includes(searchQuery)
  );

  const columns = [
    { 
      header: 'Driver', 
      accessor: (d: DriverWithUser) => (
        <div className="driver-info">
          <div className="driver-avatar">
            <UserIcon size={16} />
          </div>
          <div className="driver-details">
            <span className="driver-name">{d.fullName}</span>
            <span className="driver-email">{d.user?.email || 'N/A'}</span>
          </div>
        </div>
      )
    },
    { header: 'Phone', accessor: 'phone' as keyof DriverWithUser },
    { 
      header: 'License Class', 
      accessor: 'licenseClass' as keyof DriverWithUser 
    },
    { 
      header: 'Status', 
      accessor: (d: DriverWithUser) => (
        <Badge variant={d.status === 'available' ? 'success' : d.status === 'on_trip' ? 'primary' : 'neutral'}>
          {d.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (d: DriverWithUser) => (
        <div className="action-buttons">
          <Button variant="ghost" size="sm" icon={<Phone size={16} />} aria-label={`Call ${d.fullName}`} />
          <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} aria-label={`Edit ${d.fullName}`} />
          <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} className="text-danger" aria-label={`Delete ${d.fullName}`} />
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Driver Management</h1>
          <p className="text-dim">Monitor driver performance, status, and contact information.</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
          Register New Driver
        </Button>
      </header>

      <Modal
        isOpen={Boolean(selectedDriver)}
        onClose={() => setSelectedDriver(null)}
        title="Driver Details"
      >
        {selectedDriver && (
          <div className="driver-detail">
            <div className="driver-detail-header">
              <div className="driver-avatar large">
                <UserIcon size={24} />
              </div>
              <div>
                <h3>{selectedDriver.fullName}</h3>
                <p className="text-dim">{selectedDriver.user?.email}</p>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span>{selectedDriver.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <Badge variant={selectedDriver.status === 'available' ? 'success' : selectedDriver.status === 'on_trip' ? 'primary' : 'neutral'}>
                  {selectedDriver.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="detail-item">
                <span className="detail-label">License Class</span>
                <span>{selectedDriver.licenseClass}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expiry</span>
                <span>{selectedDriver.licenseExpiry && mounted ? new Date(selectedDriver.licenseExpiry).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <section className="filters-bar card">
        <SearchInput
          placeholder="Search by name, email or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="filter-actions">
          <Button variant="secondary" size="md" icon={<Filter size={18} />}>Filters</Button>
          <div className="divider" />
          <span className="results-count">Total <b>{filteredDrivers.length}</b> drivers</span>
        </div>
      </section>

      <section className="table-section">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size={32} />
          </div>
        ) : (
          <DataTable data={filteredDrivers} columns={columns} onRowClick={(driver) => setSelectedDriver(driver as DriverWithUser)} />
        )}
      </section>

      <style jsx>{`
        .page-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
        }

        .filters-bar :global(.search-input-group) {
          flex: 1;
          max-width: 400px;
        }

        .driver-info {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .driver-detail {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .driver-detail-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .driver-avatar.large {
          width: 56px;
          height: 56px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-md);
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: var(--space-md);
          background: var(--color-surface-low);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-default);
        }

        .detail-label {
          font: var(--font-label-sm);
          color: var(--color-text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .driver-avatar {
          width: 32px;
          height: 32px;
          background: var(--color-surface-highest);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary-light);
        }

        .driver-details {
          display: flex;
          flex-direction: column;
        }

        .driver-name {
          font-weight: 600;
          color: var(--color-text);
        }

        .driver-email {
          font-size: 12px;
          color: var(--color-text-dim);
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-warning);
          font-weight: 600;
        }

        .star-icon {
          fill: var(--color-warning);
        }

        .action-buttons {
          display: flex;
          gap: 4px;
        }

        .divider {
          width: 1px;
          height: 24px;
          background: var(--color-border);
        }

        .results-count {
          font: var(--font-label-sm);
          color: var(--color-text-dim);
        }
      `}</style>
    </div>
  );
}
