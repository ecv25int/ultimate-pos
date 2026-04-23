import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'timestamp' in data &&
          'statusCode' in data
        ) {
          return data as ApiResponse;
        }

        return {
          success: true,
          message: 'Success',
          data,
          timestamp: new Date(),
          statusCode: response.statusCode,
        };
      }),
    );
  }
}
