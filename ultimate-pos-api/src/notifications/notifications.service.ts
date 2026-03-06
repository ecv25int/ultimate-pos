import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';
import { SmsService } from './sms.service';
import { WebPushService } from '../push/web-push.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
    private webPush: WebPushService,
  ) {}

  /**
   * Create a new in-app notification
   */
  async create(businessId: number, dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        businessId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        link: dto.link ?? null,
      },
    });
  }

  /**
   * Get all notifications for the requesting user (paginated)
   */
  async findAll(
    userId: number,
    businessId: number,
    unreadOnly = false,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      businessId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Count unread notifications for a user
   */
  async getUnreadCount(userId: number, businessId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, businessId, isRead: false },
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: number, userId: number, businessId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, businessId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllRead(userId: number, businessId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, businessId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  /**
   * Delete a notification
   */
  async remove(id: number, userId: number, businessId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, businessId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  }

  /**
   * Delete all notifications for a user (clear inbox)
   */
  async clearAll(userId: number, businessId: number) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, businessId },
    });
    return { deleted: result.count };
  }

  // ─────────────────────────────────────────────────────────
  // Domain helpers — called by other NestJS services
  // ─────────────────────────────────────────────────────────

  /**
   * Emit a low-stock alert notification to all admin/manager users
   * in the given business
   */
  async sendLowStockAlerts(businessId: number) {
    // Find products below alert quantity
    const stockEntries = await this.prisma.stockEntry.groupBy({
      by: ['productId'],
      where: { businessId },
      _sum: { quantity: true },
    });

    const products = await this.prisma.product.findMany({
      where: { businessId, enableStock: true },
      select: { id: true, name: true, sku: true, alertQuantity: true },
    });

    const admins = await this.prisma.user.findMany({
      where: {
        businessId,
        isActive: true,
        userType: { in: ['admin', 'manager'] },
      },
      select: { id: true, email: true, username: true },
    });

    if (!admins.length) return;

    for (const product of products) {
      const entry = stockEntries.find((e) => e.productId === product.id);
      const currentStock = Number(entry?._sum?.quantity ?? 0);
      const alertQty = Number(product.alertQuantity);

      if (currentStock <= alertQty) {
        for (const admin of admins) {
          // Avoid duplicate notifications within the same hour
          const recent = await this.prisma.notification.findFirst({
            where: {
              businessId,
              userId: admin.id,
              type: NotificationType.LOW_STOCK,
              message: { contains: product.sku },
              createdAt: { gte: new Date(Date.now() - 3600_000) },
            },
          });
          if (!recent) {
            await this.create(businessId, {
              userId: admin.id,
              type: NotificationType.LOW_STOCK,
              title: 'Low Stock Alert',
              message: `${product.name} (${product.sku}) has only ${currentStock} units remaining (threshold: ${alertQty})`,
              link: `/inventory`,
            });

            // Also send email if SMTP is configured and admin has an email
            if (this.isEmailConfigured() && admin.email) {
              const html = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <h2 style="color:#dc2626">&#9888;&#65039; Low Stock Alert</h2>
                  <p>Hi <strong>${admin.username}</strong>,</p>
                  <p>The following product is running low on stock:</p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr style="background:#f9fafb">
                      <th style="padding:10px;text-align:left;border:1px solid #e5e7eb">Product</th>
                      <th style="padding:10px;text-align:right;border:1px solid #e5e7eb">SKU</th>
                      <th style="padding:10px;text-align:right;border:1px solid #e5e7eb">Current Stock</th>
                      <th style="padding:10px;text-align:right;border:1px solid #e5e7eb">Alert Threshold</th>
                    </tr>
                    <tr>
                      <td style="padding:10px;border:1px solid #e5e7eb">${product.name}</td>
                      <td style="padding:10px;text-align:right;border:1px solid #e5e7eb">${product.sku}</td>
                      <td style="padding:10px;text-align:right;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold">${currentStock}</td>
                      <td style="padding:10px;text-align:right;border:1px solid #e5e7eb">${alertQty}</td>
                    </tr>
                  </table>
                  <p>Please restock this item as soon as possible.</p>
                  <a href="${process.env.FRONTEND_URL ?? 'http://localhost:4200'}/inventory"
                    style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px">
                    View Inventory
                  </a>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
                  <p style="color:#6b7280;font-size:12px">Ultimate POS Notification System</p>
                </div>`;
              await this.sendEmail(
                admin.email,
                `Low Stock Alert: ${product.name}`,
                html,
              );
            }

            // Web push
            this.webPush.sendToUser(admin.id, {
              title: 'Low Stock Alert',
              body: `${product.name} (${product.sku}) has only ${currentStock} units left`,
              icon: '/icons/icon-192x192.png',
              url: '/inventory',
              tag: `low-stock-${product.id}`,
            });
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // Email (optional — requires SMTP in .env)
  // ─────────────────────────────────────────────────────────

  private getTransporter() {
    const host = process.env.MAIL_HOST;
    const port = Number(process.env.MAIL_PORT ?? 587);
    // Support generic SMTP or SendGrid relay (MAIL_PASS = SENDGRID_API_KEY when user = 'apikey')
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS || process.env.SENDGRID_API_KEY;

    if (!host || !user || !pass) return null;

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  isEmailConfigured(): boolean {
    const host = process.env.MAIL_HOST;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS || process.env.SENDGRID_API_KEY;
    return !!(host && user && pass);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) return false;

    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM ?? process.env.EMAIL_FROM ?? process.env.MAIL_USER,
        to,
        subject,
        html,
      });
      return true;
    } catch {
      return false;
    }
  }

  async sendTestEmail(to: string, name: string): Promise<{ sent: boolean; configured: boolean }> {
    const configured = this.isEmailConfigured();
    if (!configured) return { sent: false, configured: false };

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1d4ed8">Ultimate POS — Test Email</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>This is a test email confirming your SMTP configuration is working correctly.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
        <p style="color:#6b7280;font-size:12px">Sent from Ultimate POS Notification System</p>
      </div>`;

    const sent = await this.sendEmail(to, 'Ultimate POS — Test Email', html);
    return { sent, configured: true };
  }

  // ─────────────────────────────────────────────────────────
  // SMS helpers — called by other NestJS services
  // ─────────────────────────────────────────────────────────

  /**
   * Send SMS low-stock alert to admins who have a mobile number.
   * Called alongside sendLowStockAlerts().
   */
  sendLowStockSms(businessName: string, productName: string, sku: string, currentStock: number, mobile: string): void {
    this.sms.sendAsync({
      to: mobile,
      body: `[${businessName}] Low Stock Alert: ${productName} (${sku}) has only ${currentStock} units left. Please restock.`,
    });
  }

  /**
   * Send SMS sale confirmation to a customer.
   */
  sendSaleConfirmationSms(
    mobile: string,
    customerName: string,
    invoiceNo: string,
    finalTotal: number,
    currency = 'USD',
  ): void {
    this.sms.sendAsync({
      to: mobile,
      body: `Hi ${customerName}, thank you for your purchase! Invoice #${invoiceNo}, Total: ${finalTotal.toFixed(2)} ${currency}. Thank you for shopping with us.`,
    });
  }

  /**
   * Send SMS payment reminder to a customer.
   */
  sendPaymentReminderSms(
    mobile: string,
    customerName: string,
    invoiceNo: string,
    dueAmount: number,
    currency = 'USD',
  ): void {
    this.sms.sendAsync({
      to: mobile,
      body: `Hi ${customerName}, a payment of ${dueAmount.toFixed(2)} ${currency} is due for Invoice #${invoiceNo}. Please contact us to settle your balance.`,
    });
  }

  get isSmsConfigured(): boolean {
    return this.sms.isConfigured;
  }
}
