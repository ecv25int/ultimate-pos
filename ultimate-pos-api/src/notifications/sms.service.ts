import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

export interface SmsOptions {
  to: string;   // E.164 format, e.g. +1234567890
  body: string;
}

/**
 * SmsService — wraps the Twilio REST API.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER  (E.164 format, e.g. +12025551234)
 *
 * If any env var is missing the service silently skips sending
 * (same pattern as MailService) so dev environments without
 * Twilio credentials won't throw.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: ReturnType<typeof Twilio> | null;
  private readonly from: string;

  constructor(private config: ConfigService) {
    const sid = config.get<string>('TWILIO_ACCOUNT_SID');
    const token = config.get<string>('TWILIO_AUTH_TOKEN');
    this.from = config.get<string>('TWILIO_PHONE_NUMBER') ?? '';

    if (sid && token && this.from) {
      this.client = Twilio(sid, token);
    } else {
      this.client = null;
      this.logger.warn(
        'Twilio credentials not configured — SMS sending disabled. ' +
        'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env',
      );
    }
  }

  /** Fire-and-forget. Never throws — logs the error instead. */
  sendAsync(opts: SmsOptions): void {
    if (!this.client) return;
    this.client.messages
      .create({ from: this.from, to: opts.to, body: opts.body })
      .then((msg) => this.logger.debug(`SMS sent to ${opts.to}: ${msg.sid}`))
      .catch((err) =>
        this.logger.error(`SMS failed to ${opts.to}: ${(err as Error).message}`),
      );
  }

  /** Awaitable version — rejects on Twilio error. Prefer sendAsync for hooks. */
  async send(opts: SmsOptions): Promise<string | null> {
    if (!this.client) return null;
    const msg = await this.client.messages.create({
      from: this.from,
      to: opts.to,
      body: opts.body,
    });
    return msg.sid;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }
}
