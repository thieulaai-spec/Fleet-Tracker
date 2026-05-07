// ===== Utility Functions =====

import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { DriverStatus, VehicleStatus, OrderStatus, TripStatus, AlertSeverity } from '@/types';

// === Date Formatting ===
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: vi });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

// === Status Labels ===
export const statusLabels = {
  driver: {
    available: 'Rảnh',
    on_trip: 'Đang chạy',
    off_duty: 'Nghỉ',
  } satisfies Record<DriverStatus, string>,

  vehicle: {
    available: 'Sẵn sàng',
    delivering: 'Đang giao',
    maintenance: 'Bảo trì',
  } satisfies Record<VehicleStatus, string>,

  order: {
    pending: 'Chờ xử lý',
    assigned: 'Đã gán',
    picked_up: 'Đã lấy hàng',
    delivering: 'Đang giao',
    delivered: 'Đã giao',
    failed: 'Thất bại',
    cancelled: 'Đã hủy',
  } satisfies Record<OrderStatus, string>,

  trip: {
    pending: 'Chờ xác nhận',
    accepted: 'Đã chấp nhận',
    in_progress: 'Đang chạy',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  } satisfies Record<TripStatus, string>,
};

// === Status Badge Variant ===
export function getStatusBadge(type: string, status: string): string {
  const map: Record<string, Record<string, string>> = {
    driver: { available: 'success', on_trip: 'primary', off_duty: 'neutral' },
    vehicle: { available: 'success', delivering: 'primary', maintenance: 'warning' },
    order: {
      pending: 'neutral', assigned: 'primary', picked_up: 'primary',
      delivering: 'primary', delivered: 'success', failed: 'danger',
    },
    trip: {
      pending: 'neutral', accepted: 'primary', in_progress: 'primary',
      completed: 'success', cancelled: 'danger',
    },
  };
  return map[type]?.[status] || 'neutral';
}

// === Number Formatting ===
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatCurrency(num: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

// === Alert Severity ===
export function getSeverityColor(severity: AlertSeverity): string {
  const map: Record<AlertSeverity, string> = {
    low: 'var(--color-info)',
    medium: 'var(--color-warning)',
    high: '#f97316',
    critical: 'var(--color-danger)',
  };
  return map[severity];
}

// === Class Helper ===
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
