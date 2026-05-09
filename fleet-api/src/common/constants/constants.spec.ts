import {
  CONFIG,
  UserRole,
  DriverStatus,
  VehicleType,
  VehicleStatus,
  OrderStatus,
  TripStatus,
  AlertType,
  AlertSeverity,
} from './index';

describe('CONFIG constants', () => {
  it('should have GPS configuration', () => {
    expect(CONFIG.GPS_UPDATE_INTERVAL_MS).toBe(5000);
    expect(CONFIG.GPS_BATCH_INSERT_INTERVAL).toBe(5000);
  });

  it('should have alert thresholds', () => {
    expect(CONFIG.MAX_SPEED_KMH).toBe(80);
    expect(CONFIG.ROUTE_DEVIATION_METERS).toBe(500);
    expect(CONFIG.IDLE_TIMEOUT_MINUTES).toBe(10);
    expect(CONFIG.SPEED_VIOLATION_TOLERANCE_SEC).toBe(3);
  });

  it('should have KPI penalty values', () => {
    expect(CONFIG.KPI_PENALTY_SPEED).toBe(5);
    expect(CONFIG.KPI_PENALTY_ROUTE).toBe(8);
    expect(CONFIG.KPI_PENALTY_IDLE).toBe(3);
    expect(CONFIG.KPI_PENALTY_INCIDENT).toBe(10);
    expect(CONFIG.KPI_MAX_SCORE).toBe(100);
  });

  it('should have fuel rates for all vehicle types', () => {
    expect(CONFIG.FUEL_RATE.small).toBe(8);
    expect(CONFIG.FUEL_RATE.medium).toBe(12);
    expect(CONFIG.FUEL_RATE.large).toBe(16);
    expect(CONFIG.FUEL_PRICE_VND).toBe(25000);
  });

  it('should have dispatch configuration', () => {
    expect(CONFIG.DISPATCH_SUGGEST_LIMIT).toBe(5);
    expect(CONFIG.CLUSTER_RADIUS_METERS).toBe(3000);
  });

  it('should have auth configuration', () => {
    expect(CONFIG.JWT_ACCESS_EXPIRY).toBe('1h');
    expect(CONFIG.JWT_REFRESH_EXPIRY).toBe('7d');
  });

  it('should have upload configuration', () => {
    expect(CONFIG.MAX_FILE_SIZE_MB).toBe(5);
    expect(CONFIG.ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
    expect(CONFIG.ALLOWED_IMAGE_TYPES).toContain('image/png');
    expect(CONFIG.ALLOWED_IMAGE_TYPES).toContain('image/webp');
    expect(CONFIG.ALLOWED_IMAGE_TYPES).toHaveLength(3);
  });
});

describe('UserRole enum', () => {
  it('should have correct values', () => {
    expect(UserRole.ADMIN).toBe('admin');
    expect(UserRole.DRIVER).toBe('driver');
  });

  it('should have exactly 2 roles', () => {
    const values = Object.values(UserRole);
    expect(values).toHaveLength(2);
  });
});

describe('DriverStatus enum', () => {
  it('should have correct values', () => {
    expect(DriverStatus.AVAILABLE).toBe('available');
    expect(DriverStatus.ON_TRIP).toBe('on_trip');
    expect(DriverStatus.OFF_DUTY).toBe('off_duty');
  });
});

describe('VehicleType enum', () => {
  it('should have correct values', () => {
    expect(VehicleType.SMALL).toBe('small');
    expect(VehicleType.MEDIUM).toBe('medium');
    expect(VehicleType.LARGE).toBe('large');
  });
});

describe('VehicleStatus enum', () => {
  it('should have correct values', () => {
    expect(VehicleStatus.AVAILABLE).toBe('available');
    expect(VehicleStatus.DELIVERING).toBe('delivering');
    expect(VehicleStatus.MAINTENANCE).toBe('maintenance');
  });
});

describe('OrderStatus enum', () => {
  it('should have correct values', () => {
    expect(OrderStatus.PENDING).toBe('pending');
    expect(OrderStatus.ASSIGNED).toBe('assigned');
    expect(OrderStatus.PICKED_UP).toBe('picked_up');
    expect(OrderStatus.DELIVERING).toBe('delivering');
    expect(OrderStatus.DELIVERED).toBe('delivered');
    expect(OrderStatus.FAILED).toBe('failed');
  });

  it('should have 6 statuses', () => {
    const values = Object.values(OrderStatus);
    expect(values).toHaveLength(6);
  });
});

describe('TripStatus enum', () => {
  it('should have correct values', () => {
    expect(TripStatus.PENDING).toBe('pending');
    expect(TripStatus.ACCEPTED).toBe('accepted');
    expect(TripStatus.IN_PROGRESS).toBe('in_progress');
    expect(TripStatus.COMPLETED).toBe('completed');
    expect(TripStatus.CANCELLED).toBe('cancelled');
  });
});

describe('AlertType enum', () => {
  it('should have correct values', () => {
    expect(AlertType.SPEED_VIOLATION).toBe('speed_violation');
    expect(AlertType.ROUTE_DEVIATION).toBe('route_deviation');
    expect(AlertType.ABNORMAL_STOP).toBe('abnormal_stop');
    expect(AlertType.INCIDENT).toBe('incident');
  });
});

describe('AlertSeverity enum', () => {
  it('should have correct values', () => {
    expect(AlertSeverity.LOW).toBe('low');
    expect(AlertSeverity.MEDIUM).toBe('medium');
    expect(AlertSeverity.HIGH).toBe('high');
    expect(AlertSeverity.CRITICAL).toBe('critical');
  });
});
