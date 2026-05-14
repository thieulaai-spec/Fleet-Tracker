import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Vehicle } from '@/types';

import { toast } from 'sonner';

export function useVehicles(queryParams?: Record<string, any>) {
  const queryClient = useQueryClient();

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', queryParams],
    queryFn: async () => {
      return await api.get<any>('/vehicles', { params: queryParams });
    },
  });

  const queryData = vehiclesQuery.data;
  const vehicles = Array.isArray(queryData) ? queryData : (queryData?.data || []);
  const total = Array.isArray(queryData) ? queryData.length : (queryData?.total || 0);

  const createVehicleMutation = useMutation({
    mutationFn: (data: Partial<Vehicle>) => api.post<Vehicle>('/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle created successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create vehicle');
    }
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Vehicle> & { id: string }) => 
      api.patch<Vehicle>(`/vehicles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update vehicle');
    }
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete vehicle');
    }
  });

  return {
    vehicles,
    total,
    page: queryData?.page || 1,
    limit: queryData?.limit || 10,
    totalPages: queryData?.totalPages || 1,
    isLoading: vehiclesQuery.isLoading,
    error: vehiclesQuery.error,
    createVehicle: createVehicleMutation.mutateAsync,
    updateVehicle: updateVehicleMutation.mutateAsync,
    deleteVehicle: deleteVehicleMutation.mutateAsync,
    isCreating: createVehicleMutation.isPending,
    isUpdating: updateVehicleMutation.isPending,
    isDeleting: deleteVehicleMutation.isPending,
  };
}
