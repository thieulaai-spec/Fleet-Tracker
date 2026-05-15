import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DriverWithUser } from '../types';

interface DriverDeleteDialogProps {
  driver: DriverWithUser | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DriverDeleteDialog({
  driver,
  onClose,
  onConfirm,
  isLoading
}: DriverDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={Boolean(driver)}
      title="Delete driver"
      description={`Are you sure you want to delete ${driver?.fullName}? This action cannot be undone.`}
      confirmLabel="Delete"
      confirmVariant="danger"
      isLoading={isLoading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
