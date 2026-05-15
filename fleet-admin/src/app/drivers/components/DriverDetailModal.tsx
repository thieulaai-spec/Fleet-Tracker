import { User as UserIcon, Phone, CreditCard, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { DriverWithUser } from '../types';

interface DriverDetailModalProps {
  driver: DriverWithUser | null;
  onClose: () => void;
  mounted: boolean;
}

export function DriverDetailModal({ driver, onClose, mounted }: DriverDetailModalProps) {
  if (!driver) return null;

  return (
    <Modal
      isOpen={Boolean(driver)}
      onClose={onClose}
      title="Driver Details"
    >
      <div className="flex flex-col gap-lg">
        <div className="flex items-center gap-lg mb-lg pb-lg border-b border-border">
          <div className="w-16 h-16 bg-primary/10 text-primary-light rounded-full flex items-center justify-center shadow-glow">
            <UserIcon size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{driver.fullName}</h3>
            <p className="text-dim">{driver.user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-lg">
          <DetailCard label="Phone" value={driver.phone} icon={<Phone size={16} className="text-primary-light" />} />
          <div className="flex flex-col gap-md p-lg bg-surface-low border border-border rounded-default transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-glow">
            <span className="text-xs font-bold text-dim uppercase tracking-wider">Status</span>
            <Badge variant={driver.status === 'available' ? 'success' : driver.status === 'on_trip' ? 'primary' : 'neutral'}>
              {driver.status.replace('_', ' ')}
            </Badge>
          </div>
          <DetailCard label="License Class" value={driver.licenseClass || 'N/A'} icon={<CreditCard size={16} className="text-primary-light" />} />
          <DetailCard 
            label="Expiry Date" 
            value={driver.licenseExpiry && mounted ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'} 
            icon={<Calendar size={16} className="text-primary-light" />} 
          />
        </div>
      </div>
    </Modal>
  );
}

function DetailCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-md p-lg bg-surface-low border border-border rounded-default transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-glow">
      <span className="text-xs font-bold text-dim uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-md">
        {icon}
        <span className="font-semibold">{value}</span>
      </div>
    </div>
  );
}
