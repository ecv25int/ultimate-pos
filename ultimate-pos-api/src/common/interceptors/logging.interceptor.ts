import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const startedAt = Date.now();

    const method = request.method;
    const path = request.originalUrl || request.url;
    const username = request.user?.username || 'anonymous';

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAt;
          const statusCode = response.statusCode;
          this.logger.log(
            `${method} ${path} User: ${username} ${statusCode} ${durationMs}ms`,
          );
        },
        error: () => {
          const durationMs = Date.now() - startedAt;
          const statusCode = response.statusCode;
          this.logger.error(
            `${method} ${path} User: ${username} ${statusCode} ${durationMs}ms`,
          );
        },
      }),
    );
  }
}