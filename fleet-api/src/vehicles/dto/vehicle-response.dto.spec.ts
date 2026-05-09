import { VehicleResponseDto, UserResponseDto } from './vehicle-response.dto';
import { UserRole } from '../../entities/user.entity';

describe('VehicleResponseDto', () => {
  it('should create an instance with all required properties', () => {
    const dto = new VehicleResponseDto();
    dto.id = 'uuid-vehicle';
    dto.plate_number = '51A-12345';
    dto.type = 'medium';
    dto.max_capacity_kg = 1500;
    dto.status = 'available';
    dto.created_at = new Date('2026-01-01');
    dto.updated_at = new Date('2026-01-02');

    expect(dto.id).toBe('uuid-vehicle');
    expect(dto.plate_number).toBe('51A-12345');
    expect(dto.type).toBe('medium');
    expect(dto.max_capacity_kg).toBe(1500);
    expect(dto.status).toBe('available');
  });

  it('should allow optional image_url', () => {
    const dto = new VehicleResponseDto();
    expect(dto.image_url).toBeUndefined();

    dto.image_url = 'https://example.com/truck.jpg';
    expect(dto.image_url).toBe('https://example.com/truck.jpg');
  });

  it('should allow optional current_driver_id', () => {
    const dto = new VehicleResponseDto();
    expect(dto.current_driver_id).toBeUndefined();

    dto.current_driver_id = 'driver-uuid';
    expect(dto.current_driver_id).toBe('driver-uuid');
  });
});

describe('UserResponseDto', () => {
  it('should create an instance with all properties', () => {
    const dto = new UserResponseDto();
    dto.id = 'uuid-user';
    dto.email = 'admin@fleet.com';
    dto.role = UserRole.ADMIN;
    dto.is_active = true;

    expect(dto.id).toBe('uuid-user');
    expect(dto.email).toBe('admin@fleet.com');
    expect(dto.role).toBe(UserRole.ADMIN);
    expect(dto.is_active).toBe(true);
  });

  it('should accept all UserRole values', () => {
    const dto = new UserResponseDto();
    for (const role of Object.values(UserRole)) {
      dto.role = role;
      expect(dto.role).toBe(role);
    }
  });
});
