import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Auth } from './auth';

describe('Auth', () => {
  let service: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for isAuthenticated when no token', () => {
    localStorage.removeItem('access_token');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return null for getCurrentUser when not logged in', () => {
    localStorage.removeItem('current_user');
    // Re-inject to pick up cleared storage
    expect(service.getCurrentUser()).toBeNull();
  });
});

