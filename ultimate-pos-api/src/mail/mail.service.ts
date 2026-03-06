import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT');
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ?? 587,
        secure: (port ?? 587) === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'Mail transport not configured — emails will be logged to console only. ' +
          'Set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS in .env to enable real sending.',
      );
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const appUrl =
      this.config.get<string>('APP_URL') || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    const html = `
      <h2>Verify your email address</h2>
      <p>Click the button below to verify your email for Ultimate POS.</p>
      <a href="${verifyUrl}" style="
        display:inline-block;padding:12px 24px;background:#1a73e8;
        color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">
        Verify Email
      </a>
      <p style="margin-top:16px;color:#666;font-size:13px;">
        Or paste this URL into your browser:<br>
        <a href="${verifyUrl}">${verifyUrl}</a>
      </p>
      <p style="color:#666;font-size:12px;">This link expires in 24 hours.</p>
    `;

    await this.send({
      to,
      subject: 'Verify your Ultimate POS account',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const html = `
      <h2>Reset your password</h2>
      <p>We received a request to reset your Ultimate POS password.</p>
      <a href="${resetUrl}" style="
        display:inline-block;padding:12px 24px;background:#d93025;
        color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">
        Reset Password
      </a>
      <p style="margin-top:16px;color:#666;font-size:13px;">
        Or paste this URL into your browser:<br>
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
      <p style="color:#666;font-size:12px;">
        This link expires in 1 hour. If you did not request a password reset, ignore this email.
      </p>
    `;

    await this.send({
      to,
      subject: 'Reset your Ultimate POS password',
      html,
    });
  }

  private async send(opts: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const from =
      this.config.get<string>('EMAIL_FROM') || 'noreply@ultimatepos.com';

    if (!this.transporter) {
      // Dev fallback — log to console
      this.logger.log(`[MAIL] To: ${opts.to} | Subject: ${opts.subject}`);
      this.logger.log(`[MAIL body] ${opts.html.replace(/<[^>]+>/g, ' ').trim()}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      this.logger.log(`Email sent to ${opts.to}: ${opts.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}: ${(err as Error).message}`);
      // Do not rethrow — email failure should not break the main flow
    }
  }
}
