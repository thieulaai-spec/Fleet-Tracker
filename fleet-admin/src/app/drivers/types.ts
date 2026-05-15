import { Driver } from '@/types';

export interface DriverWithUser extends Driver {
  user?: { email: string };
}

export interface DriverStats {
  total: number;
  active: number;
  avgPerformance: string;
}

export interface DriverFormValues {
  fullName: string;
  email?: string;
  password?: string;
  phone: string;
  licenseClass: string;
  licenseExpiry: string;
}
