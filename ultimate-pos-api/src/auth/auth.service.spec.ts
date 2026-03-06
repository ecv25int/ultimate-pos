import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UserRole } from './enums/user-role.enum';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: '$2b$10$placeholder',
  firstName: 'Test',
  lastName: 'User',
  userType: 'user',
  businessId: 1,
  isActive: true,
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('signed-token'),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    const cfg: Record<string, string> = {
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_SECRET: 'test-secret',
    };
    return cfg[key];
  }),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService,  useValue: mockPrismaService },
        { provide: JwtService,     useValue: mockJwtService },
        { provide: ConfigService,  useValue: mockConfigService },
        { provide: MailService,    useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      userType: UserRole.USER,
      businessId: 1,
    };

    it('creates a user and returns tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const { password: _, ...safe } = { ...mockUser, id: 2, username: 'newuser' };
      mockPrismaService.user.create.mockResolvedValue(safe);

      const result = await service.register(dto);

      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.username).toBe('newuser');
    });

    it('throws ConflictException when username already taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when email already taken', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, password: hash });

      const result = await service.login({ username: 'testuser', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result.user).not.toHaveProperty('password');
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ username: 'ghost', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for inactive account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.login({ username: 'testuser', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, password: hash, failedAttempts: 0 });

      await expect(
        service.login({ username: 'testuser', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws locked-account error when lockedUntil is in the future', async () => {
      const hash = await bcrypt.hash('password123', 10);
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser, password: hash, failedAttempts: 5, lockedUntil,
      });

      await expect(
        service.login({ username: 'testuser', password: 'password123' }),
      ).rejects.toThrow(/Account locked/);
    });

    it('allows login after lockout has expired', async () => {
      const hash = await bcrypt.hash('password123', 10);
      const expiredLock = new Date(Date.now() - 60 * 1000); // 1 min ago
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser, password: hash, failedAttempts: 5, lockedUntil: expiredLock,
      });

      const result = await service.login({ username: 'testuser', password: 'password123' });
      expect(result).toHaveProperty('accessToken');
    });

    it('locks account after 5 consecutive failures', async () => {
      const hash = await bcrypt.hash('correct', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser, password: hash, failedAttempts: 4, lockedUntil: null,
      });

      await expect(
        service.login({ username: 'testuser', password: 'wrong' }),
      ).rejects.toThrow(/Too many failed attempts/);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedAttempts: 5 }),
        }),
      );
    });
  });

  // ─── refreshToken ────────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('issues a new accessToken for a valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 1 });
      const { password: _, ...safe } = mockUser;
      mockPrismaService.user.findUnique.mockResolvedValue(safe);
      mockJwtService.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refreshToken('valid-token');

      expect(result.accessToken).toBe('new-access-token');
    });

    it('throws UnauthorizedException for expired/invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('jwt expired'); });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user is inactive post-verify', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 1 });
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.refreshToken('valid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
