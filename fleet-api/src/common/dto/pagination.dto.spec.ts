import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('should have default values', () => {
    const dto = new PaginationDto();
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('should calculate skip correctly for page 1', () => {
    const dto = new PaginationDto();
    dto.page = 1;
    dto.limit = 10;
    expect(dto.skip).toBe(0);
  });

  it('should calculate skip correctly for page 2', () => {
    const dto = new PaginationDto();
    dto.page = 2;
    dto.limit = 10;
    expect(dto.skip).toBe(10);
  });

  it('should calculate skip correctly for page 5 with limit 20', () => {
    const dto = new PaginationDto();
    dto.page = 5;
    dto.limit = 20;
    expect(dto.skip).toBe(80);
  });

  it('should calculate skip correctly for page 1 with limit 100', () => {
    const dto = new PaginationDto();
    dto.page = 1;
    dto.limit = 100;
    expect(dto.skip).toBe(0);
  });
});
