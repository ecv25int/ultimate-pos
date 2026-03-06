import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    if (registerDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        userType: registerDto.userType || 'user',
        businessId: registerDto.businessId,
        emailVerificationToken: registerDto.email ? verificationToken : null,
        isEmailVerified: !registerDto.email, // mark verified if no email provided
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        businessId: true,
        isEmailVerified: true,
      },
    });

    // Send verification email asynchronously (don't await — don't block login)
    if (registerDto.email) {
      this.mailService
        .sendVerificationEmail(registerDto.email, verificationToken)
        .catch(() => { /* errors already logged in MailService */ });
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_MINUTES = 15;

    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        userType: true,
        businessId: true,
        isActive: true,
        failedAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if account is temporarily locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const unlockAt = user.lockedUntil.toISOString();
      throw new UnauthorizedException(
        `Account locked due to too many failed attempts. Try again after ${unlockAt}.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      const newAttempts = (user.failedAttempts ?? 0) + 1;
      const shouldLock = newAttempts >= MAX_ATTEMPTS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: newAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            : undefined,
        },
      });
      if (shouldLock) {
        throw new UnauthorizedException(
          `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
        );
      }
      throw new UnauthorizedException(
        `Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`,
      );
    }

    // Successful login — reset failed attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });

    const { password, failedAttempts, lockedUntil, ...userWithoutPassword } = user;
    const tokens = await this.generateTokens(userWithoutPassword, loginDto.rememberMe ?? false);

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          businessId: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const accessToken = await this.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(
    user: {
      id: number;
      username: string;
      email?: string | null;
      userType: string;
      businessId?: number | null;
    },
    rememberMe = false,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: any = {
      sub: user.id,
      username: user.username,
      email: user.email || undefined,
      businessId: user.businessId || undefined,
      userType: user.userType,
    };

    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'default-refresh-secret';

    const accessExpiresIn = rememberMe ? '30d' : (this.configService.get<string>('JWT_EXPIRATION') || '15m');
    const refreshExpiresIn = rememberMe ? '90d' : '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: accessExpiresIn as any }),
      this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async generateAccessToken(user: {
    id: number;
    username: string;
    email?: string | null;
    userType: string;
    businessId?: number | null;
  }): Promise<string> {
    const payload: any = {
      sub: user.id,
      username: user.username,
      email: user.email || undefined,
      businessId: user.businessId || undefined,
      userType: user.userType,
    };

    return this.jwtService.signAsync(payload);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Verification token is invalid or already used');
    }

    if (user.isEmailVerified) {
      return { message: 'Email already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerificationToken: null },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(userId: number): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isEmailVerified: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) return { message: 'Email already verified' };
    if (!user.email) throw new BadRequestException('No email address on file');

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token },
    });

    await this.mailService.sendVerificationEmail(user.email, token);
    return { message: 'Verification email resent' };
  }

  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        businessId: true,
        isActive: true,
        locale: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token expires in 1 hour
    const resetExpires = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send email with reset token
    // For now, return the token in the response (remove in production)
    if (user.email) {
      this.mailService
        .sendPasswordResetEmail(user.email, resetToken)
        .catch(() => { /* errors already logged in MailService */ });
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
      // Only include token in development mode
      resetToken:
        this.configService.get('NODE_ENV') === 'production'
          ? undefined
          : resetToken,
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return {
      message: 'Password has been reset successfully',
    };
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateProfileDto.email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        businessId: true,
        isActive: true,
        locale: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password changed successfully',
    };
  }
}
