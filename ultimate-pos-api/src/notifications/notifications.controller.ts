import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

class SmsTestDto {
  @IsString()
  @IsNotEmpty()
  mobile!: string;
}

import { SmsService } from './sms.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * GET /api/notifications
   * List notifications for the current user (paginated)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findAll(
    @Request() req: any,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(
      req.user.id,
      req.user.businessId,
      unreadOnly === 'true',
      Number(page) || 1,
      Math.min(Number(limit) || 20, 100),
    );
  }

  /**
   * GET /api/notifications/unread-count
   * Return the count of unread notifications for the current user
   */
  @Get('unread-count')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.id,
      req.user.businessId,
    );
    return { count };
  }

  /**
   * POST /api/notifications
   * Create a notification (admin only — typically called internally)
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Request() req: any, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(req.user.businessId, dto);
  }

  /**
   * POST /api/notifications/low-stock-check
   * Trigger low-stock check and emit alerts for the business
   */
  @Post('low-stock-check')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async triggerLowStockCheck(@Request() req: any) {
    await this.notificationsService.sendLowStockAlerts(req.user.businessId);
    return { message: 'Low stock check complete' };
  }

  /**
   * GET /api/notifications/email-status
   * Check whether SMTP email delivery is configured on the server
   */
  @Get('email-status')
  @Roles(UserRole.ADMIN)
  getEmailStatus() {
    return {
      configured: this.notificationsService.isEmailConfigured(),
      provider: process.env.MAIL_HOST ?? null,
      from: process.env.MAIL_FROM ?? process.env.EMAIL_FROM ?? null,
    };
  }

  /**
   * POST /api/notifications/send-test-email
   * Send a test email to the currently authenticated admin user
   */
  @Post('send-test-email')
  @Roles(UserRole.ADMIN)
  async sendTestEmail(@Request() req: any) {
    const user = await this.notificationsService['prisma'].user.findUnique({
      where: { id: req.user.id },
      select: { email: true, username: true },
    });
    if (!user?.email) {
      return { sent: false, configured: false, reason: 'User has no email address' };
    }
    return this.notificationsService.sendTestEmail(user.email, user.username);
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   */
  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.notificationsService.markAsRead(
      id,
      req.user.id,
      req.user.businessId,
    );
  }

  /**
   * PATCH /api/notifications/mark-all-read
   * Mark all notifications as read for current user
   */
  @Patch('mark-all-read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(
      req.user.id,
      req.user.businessId,
    );
  }

  /**
   * DELETE /api/notifications/clear-all
   * Delete all notifications for current user
   */
  @Delete('clear-all')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  clearAll(@Request() req: any) {
    return this.notificationsService.clearAll(
      req.user.id,
      req.user.businessId,
    );
  }

  /**
   * DELETE /api/notifications/:id
   * Delete a single notification
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.notificationsService.remove(
      id,
      req.user.id,
      req.user.businessId,
    );
  }

  // ─────────────────────────────────────────────────────────
  // SMS endpoints
  // ─────────────────────────────────────────────────────────

  /**
   * GET /api/notifications/sms/status
   * Returns whether Twilio is configured on the server
   */
  @Get('sms/status')
  @Roles(UserRole.ADMIN)
  getSmsStatus() {
    return { configured: this.smsService.isConfigured };
  }

  /**
   * POST /api/notifications/sms/test
   * Send a test SMS to the provided mobile number
   */
  @Post('sms/test')
  @Roles(UserRole.ADMIN)
  async sendTestSms(@Body() dto: SmsTestDto) {
    const sid = await this.smsService.send({
      to: dto.mobile,
      body: 'This is a test SMS from Ultimate POS. Your Twilio configuration is working correctly!',
    });
    return { sent: sid !== null, sid };
  }
}
