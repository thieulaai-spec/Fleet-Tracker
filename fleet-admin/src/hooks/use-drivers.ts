import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Driver, DriverKpi } from '@/types';

interface DriverWithUser extends Driver {
  user?: { email: string };
}

import { toast } from 'sonner';

export function useDrivers() {
  const queryClient = useQueryClient();

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.get<DriverWithUser[]>('/drivers'),
  });

  const registerDriverMutation = useMutation({
    mutationFn: (data: Partial<Driver> & { email?: string; password?: string }) => api.post<Driver>('/drivers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver registered successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to register driver');
    }
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Driver> & { id: string }) => 
      api.patch<Driver>(`/drivers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver'] });
      toast.success('Driver updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update driver');
    }
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete driver');
    }
  });

  return {
    drivers: driversQuery.data || [],
    isLoading: driversQuery.isLoading,
    error: driversQuery.error,
    registerDriver: registerDriverMutation.mutateAsync,
    updateDriver: updateDriverMutation.mutateAsync,
    deleteDriver: deleteDriverMutation.mutateAsync,
    isRegistering: registerDriverMutation.isPending,
    isUpdating: updateDriverMutation.isPending,
    isDeleting: deleteDriverMutation.isPending,
  };
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: () => api.get<DriverWithUser>(`/drivers/${id}`),
    enabled: !!id,
  });
}

export function useDriverKpi(id: string) {
  return useQuery({
    queryKey: ['driver-kpi', id],
    queryFn: () => api.get<DriverKpi>(`/drivers/${id}/kpi`),
    enabled: !!id,
  });
}
