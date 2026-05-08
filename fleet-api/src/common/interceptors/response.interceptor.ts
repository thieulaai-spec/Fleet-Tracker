import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        // If the data is already formatted as a paginated response or similar, handle it
        if (data && data.data && data.total !== undefined) {
          return {
            statusCode,
            message: 'Success',
            ...data,
          };
        }

        return {
          statusCode,
          message: data?.message || 'Success',
          data: data?.data !== undefined ? data.data : data,
        };
      }),
    );
  }
}
