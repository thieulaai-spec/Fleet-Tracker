'use client';

import React from 'react';
import { 
  Plus, 
  Filter, 
  User as UserIcon, 
  Edit2, 
  Trash2, 
  Phone,
  Star,
  Mail,
  CreditCard,
  Calendar,
  Activity,
  CheckCircle,
  Navigation,
  CloudOff,
  Briefcase
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatCard } from '@/components/ui/StatCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useDrivers } from '@/hooks/use-drivers';
import { Driver } from '@/types';
import { useRouter } from 'next/navigation';

// For typing the backend response which includes the joined user
interface DriverWithUser extends Driver {
  user?: { email: string };
}

const driverSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  licenseClass: z.string().min(1, 'License class is required'),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
});

type DriverFormValues = z.infer<typeof driverSchema>;

export default function DriversPage() {
  const router = useRouter();
  const { drivers, isLoading, registerDriver, updateDriver, deleteDriver, isRegistering, isUpdating, isDeleting } = useDrivers();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [editingDriver, setEditingDriver] = React.useState<DriverWithUser | null>(null);
  const [viewingDriver, setViewingDriver] = React.useState<DriverWithUser | null>(null);
  const [driverToDelete, setDriverToDelete] = React.useState<DriverWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
  });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Handle form population when editing
  React.useEffect(() => {
    if (editingDriver) {
      reset({
        fullName: editingDriver.fullName,
        email: editingDriver.user?.email || '',
        password: '', // Password is never populated
        phone: editingDriver.phone,
        licenseClass: editingDriver.licenseClass || '',
        licenseExpiry: editingDriver.licenseExpiry ? new Date(editingDriver.licenseExpiry).toISOString().split('T')[0] : '',
      });
      setIsModalOpen(true);
    }
  }, [editingDriver, reset]);

  const filteredDrivers = (drivers as DriverWithUser[]).filter(d => {
    const matchesSearch = d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const onSubmit = async (data: DriverFormValues) => {
    try {
      if (editingDriver) {
        // Remove email/password from update if they are empty/not supported
        const { email, password, ...updateData } = data;
        await updateDriver({ id: editingDriver.id, ...updateData });
      } else {
        await registerDriver(data as any);
      }
      setIsModalOpen(false);
      setEditingDriver(null);
      reset();
    } catch (err) {
      console.error('Operation failed:', err);
    }
  };

  const columns = [
    { 
      header: 'Driver', 
      accessor: (d: DriverWithUser) => (
        <div className="flex items-center gap-md">
          <div className="w-8 h-8 bg-surface-high rounded-full flex items-center justify-center text-primary-light">
            <UserIcon size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-text">{d.fullName}</span>
            <span className="text-xs text-dim">{d.user?.email || 'N/A'}</span>
          </div>
        </div>
      )
    },
    { header: 'Phone', accessor: 'phone' as keyof DriverWithUser },
    { 
      header: 'License', 
      accessor: (d: DriverWithUser) => (
        <div className="flex flex-col">
          <span className="font-medium">{d.licenseClass || 'N/A'}</span>
          <span className="text-xs text-dim">{d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : ''}</span>
        </div>
      )
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
        <div className="flex gap-sm">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Edit2 size={16} />} 
            aria-label={`Edit ${d.fullName}`}
            onClick={(e) => {
              e.stopPropagation();
              setEditingDriver(d);
            }}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Trash2 size={16} />} 
            className="text-danger hover:bg-danger/10" 
            aria-label={`Delete ${d.fullName}`}
            onClick={(e) => {
              e.stopPropagation();
              setDriverToDelete(d);
            }}
          />
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-2xl">
      <header className="flex justify-between items-end mb-xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
          <p className="text-dim text-base">Monitor, manage and analyze your fleet's driver performance in real-time.</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => { 
          setEditingDriver(null);
          reset({
            fullName: '',
            email: '',
            password: '',
            phone: '',
            licenseClass: '',
            licenseExpiry: '',
          });
          setIsModalOpen(true); 
        }}>
          Register New Driver
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-2xl">
        <StatCard 
          label="Total Drivers" 
          value={isLoading ? '...' : drivers.length.toLocaleString()} 
          icon={UserIcon}
          color="var(--color-primary)"
        />
        <StatCard 
          label="Active Now" 
          value={isLoading ? '...' : drivers.filter((d: any) => d.status === 'on_trip').length.toLocaleString()} 
          icon={UserIcon}
          color="var(--color-success)"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard 
          label="Avg Performance" 
          value="94.2%" 
          icon={Star}
          color="var(--color-warning)"
          trend={{ value: 2.1, isUp: true }}
        />
      </section>

      <section className="card flex justify-between items-center px-xl py-lg gap-xl mb-xl shadow-glow border-primary/10 transition-all duration-300 hover:border-primary/30 hover:shadow-glow-lg">
        <SearchInput
          placeholder="Search by name, email or phone..."
          value={searchQuery}
          className="flex-1 max-w-[480px]"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center gap-lg">
          <div className="flex items-center gap-md">
            <Select
              options={[
                { label: 'All Status', value: 'all', icon: <Activity size={14} /> },
                { label: 'Available', value: 'available', icon: <CheckCircle size={14} className="text-success" /> },
                { label: 'On Trip', value: 'on_trip', icon: <Navigation size={14} className="text-primary" /> },
                { label: 'Offline', value: 'offline', icon: <CloudOff size={14} className="text-dim" /> },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="min-w-[150px]"
            />
          </div>
          <div className="w-px h-8 bg-border" />
          <span className="text-xs text-dim font-medium">Total <b className="text-text">{filteredDrivers.length}</b> drivers</span>
        </div>
      </section>

      <section className="table-section">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size={32} />
          </div>
        ) : (
          <DataTable 
            data={filteredDrivers} 
            columns={columns} 
            onRowClick={(driver) => router.push(`/drivers/${(driver as any).id}`)} 
          />
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDriver(null);
        }}
        title={editingDriver ? 'Edit Driver Information' : 'Register New Driver'}
        footer={(
          <>
            <Button variant="secondary" onClick={() => {
              setIsModalOpen(false);
              setEditingDriver(null);
            }}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isRegistering || isUpdating}>
              {editingDriver ? 'Save Changes' : 'Register Driver'}
            </Button>
          </>
        )}
      >
        <form className="flex flex-col gap-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
            <Input 
              label="Full Name" 
              placeholder="Enter driver's full name" 
              {...register('fullName')}
              error={errors.fullName?.message}
            />
            
            {!editingDriver && (
              <>
                <Input 
                  label="Email Address" 
                  type="email"
                  placeholder="driver@example.com" 
                  {...register('email')}
                  error={errors.email?.message}
                />
                <Input 
                  label="Password" 
                  type="password"
                  placeholder="Minimum 6 characters" 
                  {...register('password')}
                  error={errors.password?.message}
                />
              </>
            )}
 
            <Input 
              label="Phone Number" 
              placeholder="e.g. 0943..." 
              {...register('phone')}
              error={errors.phone?.message}
            />
            <Select 
              label="License Class" 
              options={[
                { label: 'Class B2', value: 'B2', icon: <CreditCard size={14} /> },
                { label: 'Class C', value: 'C', icon: <CreditCard size={14} /> },
                { label: 'Class D', value: 'D', icon: <CreditCard size={14} /> },
                { label: 'Class E', value: 'E', icon: <CreditCard size={14} /> },
                { label: 'Class F', value: 'F', icon: <CreditCard size={14} /> },
              ]}
              value={watch('licenseClass')}
              onChange={(val) => setValue('licenseClass', val)}
            />
            <DatePicker 
              label="License Expiry" 
              value={watch('licenseExpiry')}
              onChange={(val) => setValue('licenseExpiry', val)}
              error={errors.licenseExpiry?.message}
            />
          </div>
          
          {editingDriver && (
            <div className="mt-4 p-3 bg-surface-high rounded-md flex items-start gap-3">
              <Mail size={16} className="text-dim mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-dim uppercase tracking-wider">Account Email</p>
                <p className="text-sm">{editingDriver.user?.email}</p>
                <p className="text-xs text-dim italic mt-1">Contact IT to change account credentials.</p>
              </div>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewingDriver)}
        onClose={() => setViewingDriver(null)}
        title="Driver Details"
      >
        {viewingDriver && (
          <div className="flex flex-col gap-lg">
            <div className="flex items-center gap-lg mb-lg pb-lg border-b border-border">
              <div className="w-16 h-16 bg-primary/10 text-primary-light rounded-full flex items-center justify-center shadow-glow">
                <UserIcon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold">{viewingDriver.fullName}</h3>
                <p className="text-dim">{viewingDriver.user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-lg">
              <div className="flex flex-col gap-md p-lg bg-surface-low border border-border rounded-default transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-glow">
                <span className="text-xs font-bold text-dim uppercase tracking-wider">Phone</span>
                <div className="flex items-center gap-md">
                  <Phone size={16} className="text-primary-light" />
                  <span className="font-semibold">{viewingDriver.phone}</span>
                </div>
              </div>
              <div className="flex flex-col gap-md p-lg bg-surface-low border border-border rounded-default transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-glow">
                <span className="text-xs font-bold text-dim uppercase tracking-wider">Status</span>
                <Badge variant={viewingDriver.status === 'available' ? 'success' : viewingDriver.status === 'on_trip' ? 'primary' : 'neutral'}>
                  {viewingDriver.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex flex-col gap-md p-lg bg-surface-low border border-border rounded-default transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-glow">
                <span className="text-xs font-bold text-dim uppercase tracking-wider">License Class</span>
                <div className="flex items-center gap-md">
                  <CreditCard size={16} className="text-primary-light" />
                  <span className="font-semibold">{viewingDriver.licenseClass || 'N/A'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-md p-lg bg-surface-low border border-border rounded-default transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-glow">
                <span className="text-xs font-bold text-dim uppercase tracking-wider">Expiry Date</span>
                <div className="flex items-center gap-md">
                  <Calendar size={16} className="text-primary-light" />
                  <span className="font-semibold">{viewingDriver.licenseExpiry && mounted ? new Date(viewingDriver.licenseExpiry).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(driverToDelete)}
        title="Delete driver"
        description={`Are you sure you want to delete ${driverToDelete?.fullName}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onClose={() => setDriverToDelete(null)}
        onConfirm={async () => {
          if (!driverToDelete) return;
          try {
            await deleteDriver(driverToDelete.id);
            setDriverToDelete(null);
          } catch (err) {
            console.error('Failed to delete driver:', err);
          }
        }}
      />

    </div>
  );
}
