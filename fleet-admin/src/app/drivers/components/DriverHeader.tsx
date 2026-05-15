import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DriverHeaderProps {
  onRegisterClick: () => void;
}

export function DriverHeader({ onRegisterClick }: DriverHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-xl">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
        <p className="text-dim text-base">Monitor, manage and analyze your fleet's driver performance in real-time.</p>
      </div>
      <Button 
        variant="primary" 
        icon={<Plus size={18} />} 
        onClick={onRegisterClick}
        className="w-full sm:w-auto"
      >
        Register New Driver
      </Button>
    </header>
  );
}
