import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../auth/auth';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

// Module-level state shared across all functional interceptor calls
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

/** Clone the request and attach the given Bearer token. */
function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/** Wait until an ongoing refresh completes, then retry with the new token. */
function waitForRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => next(withToken(req, token))),
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const router = inject(Router);

  // Skip adding token for auth endpoints (login / register / refresh)
  const isAuthRoute =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh');
  if (isAuthRoute) {
    return next(req);
  }

  // Attach access token if present
  const token = authService.getToken();
  const authReq = token ? withToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      // If another refresh is already in flight, queue this request
      if (isRefreshing) {
        return waitForRefresh(req, next);
      }

      // Start a new refresh
      isRefreshing = true;
      refreshTokenSubject.next(null); // block queued requests until token arrives

      return authService.refreshToken().pipe(
        switchMap(() => {
          const newToken = authService.getToken()!;
          refreshTokenSubject.next(newToken); // unblock queued requests
          return next(withToken(req, newToken));
        }),
        catchError((refreshError) => {
          authService.logout();
          router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        }),
        finalize(() => {
          isRefreshing = false;
        }),
      );
    }),
  );
};
