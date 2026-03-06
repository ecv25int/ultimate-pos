import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { Auth } from '../auth/auth';

describe('authGuard', () => {
  let authService: { isAuthenticated: ReturnType<typeof vi.fn> };
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = (url: string) => ({ url } as RouterStateSnapshot);

  beforeEach(() => {
    authService = { isAuthenticated: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: Auth, useValue: authService },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('returns true when user is authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState('/dashboard')),
    );

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('returns false and navigates to login when not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState('/dashboard')),
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/dashboard' },
    });
  });

  it('passes the attempted URL as returnUrl query param', () => {
    authService.isAuthenticated.mockReturnValue(false);

    TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState('/sales/orders')),
    );

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/sales/orders' },
    });
  });
});
