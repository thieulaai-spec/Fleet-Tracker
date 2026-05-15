import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { DriverWithUser, DriverFormValues } from '../types';
import { useEffect } from 'react';

const driverSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  licenseClass: z.string().min(1, 'License class is required'),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
});

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DriverFormValues) => Promise<void>;
  editingDriver: DriverWithUser | null;
  isLoading: boolean;
}

export function DriverFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingDriver,
  isLoading
}: DriverFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
  });

  useEffect(() => {
    if (editingDriver) {
      reset({
        fullName: editingDriver.fullName,
        email: editingDriver.user?.email || '',
        password: '',
        phone: editingDriver.phone,
        licenseClass: editingDriver.licenseClass || '',
        licenseExpiry: editingDriver.licenseExpiry ? new Date(editingDriver.licenseExpiry).toISOString().split('T')[0] : '',
      });
    } else {
      reset({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        licenseClass: '',
        licenseExpiry: '',
      });
    }
  }, [editingDriver, reset, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingDriver ? 'Edit Driver Information' : 'Register New Driver'}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
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
  );
}
