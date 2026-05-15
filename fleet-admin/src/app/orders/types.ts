import { Order } from '@/types';
import * as z from 'zod';

export const orderSchema = z.object({
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  weightKg: z.number().min(0.1, 'Weight must be greater than 0'),
  description: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export type OrderStatus = Order['status'];

export interface OrderStats {
  total: number;
  pending: number;
  assigned: number;
  delivering: number;
  delivered: number;
  failed: number;
  cancelled: number;
}
