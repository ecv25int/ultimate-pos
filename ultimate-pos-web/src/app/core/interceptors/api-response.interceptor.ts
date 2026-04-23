import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpResponse,
  HttpResponseBase,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface WrappedApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string | Date;
  statusCode: number;
}

function isWrappedResponse(body: unknown): body is WrappedApiResponse {
  return !!body && typeof body === 'object' && 'success' in body && 'statusCode' in body;
}

export const apiResponseInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const isApiRequest = req.url.startsWith(environment.apiUrl) || req.url.includes('/api/');

  if (!isApiRequest) {
    return next(req);
  }

  return next(req).pipe(
    map((event) => {
      if (!(event instanceof HttpResponse)) {
        return event;
      }

      if (!isWrappedResponse(event.body)) {
        return event;
      }

      return event.clone({ body: event.body.data });
    }),
  );
};