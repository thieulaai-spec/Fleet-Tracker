import { Order } from "@/types";

export interface DispatchOrderGroup {
  key: string;
  label: string;
  orders: Order[];
  isClusterGroup: boolean;
  centroid?: { lat: number; lng: number };
}
