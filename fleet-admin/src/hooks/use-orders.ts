import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Order } from '@/types';

export function useOrders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<Order[]>('/orders'),
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: Partial<Order>) => api.post<Order>('/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Order> & { id: string }) => 
      api.patch<Order>(`/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => 
      api.post<Order>(`/orders/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const assignOrderMutation = useMutation({
    mutationFn: ({ orderId, vehicleId }: { orderId: string; vehicleId: string }) => 
      api.post<Order>(`/dispatch/assign`, { orderId, vehicleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    createOrder: createOrderMutation.mutateAsync,
    assignOrder: assignOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    cancelOrder: cancelOrderMutation.mutateAsync,
    isCreating: createOrderMutation.isPending,
    isAssigning: assignOrderMutation.isPending,
    isUpdating: updateOrderMutation.isPending,
    isCancelling: cancelOrderMutation.isPending,
  };
}
