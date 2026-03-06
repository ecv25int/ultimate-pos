import { Body, Controller, Delete, Get, Post, Request, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebPushService } from './web-push.service';

class PushSubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @IsObject()
  keys!: { p256dh: string; auth: string };
}

class PushUnsubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string;
}

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly webPush: WebPushService) {}

  /** GET /push/vapid-public-key — return VAPID public key so the browser can subscribe */
  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.webPush.getPublicKey() ?? null };
  }

  /** POST /push/subscribe — store a browser PushSubscription */
  @Post('subscribe')
  async subscribe(@Request() req: any, @Body() dto: PushSubscribeDto) {
    const userAgent = req.headers['user-agent'] as string | undefined;
    await this.webPush.subscribe(
      req.user.businessId,
      req.user.userId,
      { endpoint: dto.endpoint, keys: dto.keys },
      userAgent,
    );
    return { subscribed: true };
  }

  /** DELETE /push/unsubscribe — remove a browser PushSubscription */
  @Delete('unsubscribe')
  async unsubscribe(@Request() req: any, @Body() dto: PushUnsubscribeDto) {
    await this.webPush.unsubscribe(req.user.userId, dto.endpoint);
    return { unsubscribed: true };
  }

  /** GET /push/status — tells the client whether VAPID is configured server-side */
  @Get('status')
  getStatus() {
    return { configured: this.webPush.isConfigured };
  }
}
