import { ResponseInterceptor } from './response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  const createMockContext = (statusCode = 200): ExecutionContext =>
    ({
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({ statusCode }),
        getRequest: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockExecutionContext = createMockContext(200);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('standard response wrapping', () => {
    it('should wrap plain data in ApiResponse format', (done) => {
      const testData = { id: 1, name: 'Test' };
      mockCallHandler = { handle: () => of(testData) };

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe((result) => {
          expect(result).toEqual({
            statusCode: 200,
            message: 'Success',
            data: { id: 1, name: 'Test' },
          });
          done();
        });
    });

    it('should wrap array data', (done) => {
      const testData = [1, 2, 3];
      mockCallHandler = { handle: () => of(testData) };

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe((result) => {
          expect(result).toEqual({
            statusCode: 200,
            message: 'Success',
            data: [1, 2, 3],
          });
          done();
        });
    });

    it('should wrap null data', (done) => {
      mockCallHandler = { handle: () => of(null) };

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe((result) => {
          expect(result).toEqual({
            statusCode: 200,
            message: 'Success',
            data: null,
          });
          done();
        });
    });

    it('should use custom message from data.message', (done) => {
      const testData = { message: 'Created successfully', data: { id: 1 } };
      mockCallHandler = { handle: () => of(testData) };

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe((result) => {
          expect(result.message).toBe('Created successfully');
          expect(result.data).toEqual({ id: 1 });
          done();
        });
    });
  });

  describe('paginated response handling', () => {
    it('should spread paginated response with data + total', (done) => {
      const paginatedData = {
        data: [{ id: 1 }, { id: 2 }],
        total: 50,
        page: 1,
        limit: 10,
      };
      mockCallHandler = { handle: () => of(paginatedData) };

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe((result) => {
          expect(result).toEqual({
            statusCode: 200,
            message: 'Success',
            data: [{ id: 1 }, { id: 2 }],
            total: 50,
            page: 1,
            limit: 10,
          });
          done();
        });
    });
  });

  describe('different status codes', () => {
    it('should reflect 201 status code', (done) => {
      mockExecutionContext = createMockContext(201);
      const testData = { id: 1 };
      mockCallHandler = { handle: () => of(testData) };

      interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe((result) => {
          expect(result.statusCode).toBe(201);
          done();
        });
    });
  });
});
