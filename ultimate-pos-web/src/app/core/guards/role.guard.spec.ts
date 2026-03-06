import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';
import { roleGuard } from './role.guard';
import { Auth } from '../auth/auth';
import { UserRole } from '../enums/user-role.enum';
import { User } from '../auth/auth.models';

const makeUser = (userType: string): User =>
  ({ id: 1, username: 'test', email: 'test@test.com', userType } as User);

describe('roleGuard', () => {
  let authService: { getCurrentUser: ReturnType<typeof vi.fn> };
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    authService = { getCurrentUser: vi.fn() };

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

  it('returns false and navigates to login when no user is logged in', () => {
    authService.getCurrentUser.mockReturnValue(null);

    const guard = roleGuard([UserRole.ADMIN]);
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('returns true when user has an allowed role', () => {
    authService.getCurrentUser.mockReturnValue(makeUser('admin'));

    const guard = roleGuard([UserRole.ADMIN, UserRole.MANAGER]);
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('returns false and navigates to /dashboard when role is not allowed', () => {
    authService.getCurrentUser.mockReturnValue(makeUser('cashier'));

    const guard = roleGuard([UserRole.ADMIN]);
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('returns true for manager when manager role is allowed', () => {
    authService.getCurrentUser.mockReturnValue(makeUser('manager'));

    const guard = roleGuard([UserRole.ADMIN, UserRole.MANAGER]);
    const result = TestBed.runInInjectionContext(() =>
      guard(mockRoute, mockState),
    );

    expect(result).toBe(true);
  });
});
