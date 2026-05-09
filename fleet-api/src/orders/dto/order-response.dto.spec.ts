import { OrderResponseDto } from './order-response.dto';
import { OrderStatus } from '../../entities/order.entity';

describe('OrderResponseDto', () => {
  it('should create an instance with all required properties', () => {
    const dto = new OrderResponseDto();
    dto.id = 'uuid-123';
    dto.pickup_address = '123 Main St';
    dto.delivery_address = '456 Oak Ave';
    dto.weight_kg = 10.5;
    dto.status = OrderStatus.PENDING;
    dto.created_at = new Date('2026-01-01');
    dto.updated_at = new Date('2026-01-02');

    expect(dto.id).toBe('uuid-123');
    expect(dto.pickup_address).toBe('123 Main St');
    expect(dto.delivery_address).toBe('456 Oak Ave');
    expect(dto.weight_kg).toBe(10.5);
    expect(dto.status).toBe(OrderStatus.PENDING);
    expect(dto.created_at).toEqual(new Date('2026-01-01'));
    expect(dto.updated_at).toEqual(new Date('2026-01-02'));
  });

  it('should allow optional description', () => {
    const dto = new OrderResponseDto();
    expect(dto.description).toBeUndefined();

    dto.description = 'Fragile package';
    expect(dto.description).toBe('Fragile package');
  });

  it('should accept all OrderStatus values', () => {
    const dto = new OrderResponseDto();

    for (const status of Object.values(OrderStatus)) {
      dto.status = status;
      expect(dto.status).toBe(status);
    }
  });
});
