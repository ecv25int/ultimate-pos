import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private vapidConfigured = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT', 'mailto:admin@example.com');

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('Web Push (VAPID) configured');
    } else {
      this.logger.warn(
        'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — web push disabled. ' +
          'Generate keys with: npx web-push generate-vapid-keys',
      );
    }
  }

  get isConfigured(): boolean {
    return this.vapidConfigured;
  }

  getPublicKey(): string | undefined {
    return this.config.get<string>('VAPID_PUBLIC_KEY');
  }

  /** Upsert a browser push subscription for a user. */
  async subscribe(
    businessId: number,
    userId: number,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { userId_endpoint: { userId, endpoint: subscription.endpoint } },
      create: {
        businessId,
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      },
    });
  }

  /** Remove a browser push subscription. */
  async unsubscribe(userId: number, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  /**
   * Send a push notification to all subscriptions for a given user.
   * Silently removes expired/invalid subscriptions (410/404).
   */
  async sendToUser(userId: number, payload: PushPayload): Promise<void> {
    if (!this.vapidConfigured) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    const body = JSON.stringify(payload);
    const stale: number[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            stale.push(sub.id);
          } else {
            this.logger.warn(`Push failed for sub ${sub.id}: ${err?.message}`);
          }
        }
      }),
    );

    if (stale.length > 0) {
      await this.prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
      this.logger.debug(`Removed ${stale.length} stale push subscription(s)`);
    }
  }

  /**
   * Send to all users in a business (e.g. low-stock alert for all admins/managers).
   */
  async sendToBusiness(
    businessId: number,
    roles: string[],
    payload: PushPayload,
  ): Promise<void> {
    if (!this.vapidConfigured) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { businessId },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    const body = JSON.stringify(payload);
    const stale: number[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            stale.push(sub.id);
          } else {
            this.logger.warn(`Push failed for sub ${sub.id}: ${err?.message}`);
          }
        }
      }),
    );

    if (stale.length > 0) {
      await this.prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
    }
  }
}
