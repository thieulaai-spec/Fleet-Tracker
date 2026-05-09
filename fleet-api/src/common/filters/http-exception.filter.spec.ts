import { HttpExceptionFilter } from './http-exception.filter';
import {
  HttpException,
  HttpStatus,
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockGetRequest = jest.fn().mockReturnValue({ url: '/api/test' });
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('HttpException handling', () => {
    it('should handle BadRequestException (400)', () => {
      const exception = new BadRequestException('Invalid input');
      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          path: '/api/test',
          message: 'Invalid input',
        }),
      );
    });

    it('should handle NotFoundException (404)', () => {
      const exception = new NotFoundException('Not found');
      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          path: '/api/test',
          message: 'Not found',
        }),
      );
    });

    it('should handle ForbiddenException (403)', () => {
      const exception = new ForbiddenException('Forbidden');
      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          path: '/api/test',
        }),
      );
    });

    it('should handle HttpException with array message (validation errors)', () => {
      const exception = new BadRequestException({
        message: ['email must be valid', 'name is required'],
        error: 'Bad Request',
      });
      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'email must be valid',
          error: 'Bad Request',
        }),
      );
    });

    it('should handle HttpException with custom status', () => {
      const exception = new HttpException('Custom error', HttpStatus.CONFLICT);
      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });
  });

  describe('Non-HttpException handling', () => {
    it('should handle generic Error as 500', () => {
      const exception = new Error('Something broke');
      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Something broke',
          path: '/api/test',
        }),
      );
    });

    it('should handle unknown exception with fallback message', () => {
      const exception = { name: 'UnknownError' };
      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'UnknownError',
        }),
      );
    });
  });

  it('should include timestamp in response', () => {
    const exception = new BadRequestException('Test');
    filter.catch(exception, mockHost);

    const responseBody = mockJson.mock.calls[0][0];
    expect(responseBody.timestamp).toBeDefined();
    expect(new Date(responseBody.timestamp).getTime()).not.toBeNaN();
  });
});
