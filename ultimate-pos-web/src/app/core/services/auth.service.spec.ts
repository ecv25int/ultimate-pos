import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService, UserProfile } from './auth.service';

const API = 'http://localhost:3000/api/auth';

const mockUser: UserProfile = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  businessId: 1,
};

describe('AuthService (core/services)', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login()', () => {
    it('POSTs to /auth/login and returns tokens + user', () => {
      const dto = { email: 'admin@test.com', password: 'Password1' };
      const mockResponse = {
        accessToken: 'acc',
        refreshToken: 'ref',
        user: mockUser,
      };

      let result: any;
      service.login(dto).subscribe((r) => (result = r));

      const req = http.expectOne(`${API}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('register()', () => {
    it('POSTs to /auth/register', () => {
      const dto = {
        email: 'new@test.com',
        password: 'Password1',
        username: 'newuser',
      };

      service.register(dto).subscribe();

      const req = http.expectOne(`${API}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ message: 'ok' });
    });
  });

  describe('forgotPassword()', () => {
    it('POSTs to /auth/forgot-password with email', () => {
      service.forgotPassword('user@test.com').subscribe();

      const req = http.expectOne(`${API}/forgot-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'user@test.com' });
      req.flush({ message: 'Email sent' });
    });
  });

  describe('resetPassword()', () => {
    it('POSTs to /auth/reset-password with token and newPassword', () => {
      service.resetPassword('reset-token-abc', 'NewPassword1').subscribe();

      const req = http.expectOne(`${API}/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        token: 'reset-token-abc',
        newPassword: 'NewPassword1',
      });
      req.flush({ message: 'Password reset successful' });
    });
  });

  describe('getProfile()', () => {
    it('GETs /auth/profile and returns UserProfile', () => {
      let profile: UserProfile | undefined;
      service.getProfile().subscribe((p) => (profile = p));

      const req = http.expectOne(`${API}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);

      expect(profile).toEqual(mockUser);
    });
  });

  describe('updateProfile()', () => {
    it('PUTs to /auth/profile with partial profile data', () => {
      const dto = { firstName: 'Updated', phone: '555-1234' };

      service.updateProfile(dto).subscribe();

      const req = http.expectOne(`${API}/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush({ ...mockUser, ...dto });
    });
  });

  describe('changePassword()', () => {
    it('POSTs to /auth/change-password', () => {
      const dto = { currentPassword: 'OldPass1', newPassword: 'NewPass1!' };

      service.changePassword(dto).subscribe();

      const req = http.expectOne(`${API}/change-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ message: 'Password changed' });
    });
  });
});
