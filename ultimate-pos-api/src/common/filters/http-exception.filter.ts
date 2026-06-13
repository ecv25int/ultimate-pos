import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'internal_error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        error = (res as any).error || error;
      }
      if (exception.name === 'UnauthorizedException') status = 401;
      if (exception.name === 'ForbiddenException') status = 403;
      if (exception.name === 'NotFoundException') status = 404;
      if (exception.name === 'BadRequestException') status = 400;
    } else if (exception?.name === 'ValidationError') {
      status = 400;
      message = exception.message;
      error = 'validation_error';
    }

    response.status(status).json({
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
      statusCode: status,
      path: request.url,
    });
  }
}
