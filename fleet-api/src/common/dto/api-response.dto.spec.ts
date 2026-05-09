import {
  ApiResponseDto,
  PaginatedResponseDto,
  ApiErrorDto,
} from './api-response.dto';

describe('ApiResponseDto', () => {
  it('should create with data and default message', () => {
    const dto = new ApiResponseDto({ id: 1 });
    expect(dto.success).toBe(true);
    expect(dto.data).toEqual({ id: 1 });
    expect(dto.message).toBe('OK');
  });

  it('should create with custom message', () => {
    const dto = new ApiResponseDto({ id: 1 }, 'Created');
    expect(dto.message).toBe('Created');
  });

  it('should handle null data', () => {
    const dto = new ApiResponseDto(null);
    expect(dto.success).toBe(true);
    expect(dto.data).toBeNull();
  });

  it('should handle array data', () => {
    const dto = new ApiResponseDto([1, 2, 3]);
    expect(dto.data).toEqual([1, 2, 3]);
  });
});

describe('PaginatedResponseDto', () => {
  it('should create with correct pagination meta', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const dto = new PaginatedResponseDto(items, 50, 1, 10);

    expect(dto.success).toBe(true);
    expect(dto.data).toEqual(items);
    expect(dto.meta.page).toBe(1);
    expect(dto.meta.limit).toBe(10);
    expect(dto.meta.total).toBe(50);
    expect(dto.meta.totalPages).toBe(5);
  });

  it('should calculate totalPages correctly with remainder', () => {
    const dto = new PaginatedResponseDto([], 23, 3, 10);
    expect(dto.meta.totalPages).toBe(3);
  });

  it('should handle zero total', () => {
    const dto = new PaginatedResponseDto([], 0, 1, 10);
    expect(dto.meta.totalPages).toBe(0);
    expect(dto.data).toEqual([]);
  });

  it('should handle single page', () => {
    const items = [{ id: 1 }];
    const dto = new PaginatedResponseDto(items, 1, 1, 10);
    expect(dto.meta.totalPages).toBe(1);
  });
});

describe('ApiErrorDto', () => {
  it('should create with error code and message', () => {
    const dto = new ApiErrorDto('NOT_FOUND', 'Resource not found');
    expect(dto.success).toBe(false);
    expect(dto.error.code).toBe('NOT_FOUND');
    expect(dto.error.message).toBe('Resource not found');
  });

  it('should create with different error codes', () => {
    const dto = new ApiErrorDto('VALIDATION_ERROR', 'Invalid input');
    expect(dto.error.code).toBe('VALIDATION_ERROR');
  });
});
