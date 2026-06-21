/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';
import { WebPushService } from '../push/web-push.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let sms: any;
  let webPush: any;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    notificationTemplate: {
      findFirst: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    stockEntry: {
      groupBy: jest.fn(),
    },
    sale: {
      findMany: jest.fn(),
    },
    purchase: {
      findMany: jest.fn(),
    },
    purchaseLine: {
      findMany: jest.fn(),
    },
    business: {
      findMany: jest.fn(),
    },
  };

  const smsMock = {
    sendAsync: jest.fn(),
    isConfigured: true,
  };

  const webPushMock = {
    sendToUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set default mock implementations to prevent "is not iterable" or undefined errors
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.notification.create.mockResolvedValue({});
    prismaMock.notification.findFirst.mockResolvedValue(null);
    prismaMock.notificationTemplate.findFirst.mockResolvedValue(null);
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.stockEntry.groupBy.mockResolvedValue([]);
    prismaMock.sale.findMany.mockResolvedValue([]);
    prismaMock.purchase.findMany.mockResolvedValue([]);
    prismaMock.purchaseLine.findMany.mockResolvedValue([]);
    prismaMock.business.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SmsService, useValue: smsMock },
        { provide: WebPushService, useValue: webPushMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    sms = module.get<SmsService>(SmsService);
    webPush = module.get<WebPushService>(WebPushService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should fetch user, substitute placeholders, and send via multiple channels', async () => {
      const mockUser = {
        id: 1,
        username: 'testadmin',
        email: 'admin@test.com',
        mobile: '+1234567890',
        businessId: 10,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const mockTemplate = {
        id: 1,
        businessId: 10,
        templateFor: 'stock_low',
        subject: 'Low Stock Alert for {sku}',
        emailBody:
          'Hello {username}, product with SKU {sku} has only {amount} left. Message: {message}',
        smsBody: 'Low stock: {sku} has {amount} left',
        autoSend: true,
      };
      prisma.notificationTemplate.findFirst.mockResolvedValue(mockTemplate);
      prisma.notification.create.mockResolvedValue({ id: 5 });

      jest.spyOn(service, 'isEmailConfigured').mockReturnValue(true);

      await service.sendNotification(1, 'stock_low', 'Stock is very low', 10, {
        sku: 'SKU-ABC',
        amount: 5,
        mobile: '+1234567890',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
      expect(prisma.notificationTemplate.findFirst).toHaveBeenCalledWith({
        where: { businessId: 10, templateFor: 'stock_low' },
      });

      // in-app notification creation
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          businessId: 10,
          userId: 1,
          type: 'stock_low',
          title: 'Low Stock Alert for SKU-ABC',
          message: 'Stock is very low',
          link: null,
        },
      });

      // Email routed
      expect(service.isEmailConfigured).toHaveBeenCalled();

      // SMS routed
      expect(sms.sendAsync).toHaveBeenCalledWith({
        to: '+1234567890',
        body: 'Low stock: SKU-ABC has 5 left',
      });

      // Web push routed
      expect(webPush.sendToUser).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  describe('runAlertChecks', () => {
    const mockAdmins = [{ id: 2, username: 'admin1', email: 'admin1@test.com' }];

    beforeEach(() => {
      prisma.user.findMany.mockResolvedValue(mockAdmins);
    });

    it('should trigger stock low alert when stock <= threshold and no recent notification exists', async () => {
      prisma.stockEntry.groupBy.mockResolvedValue([
        { productId: 5, _sum: { quantity: new Decimal(2) } },
      ]);
      prisma.product.findMany.mockResolvedValue([
        { id: 5, name: 'Apple iPad', sku: 'SKU-APPLE', alertQuantity: 5 },
      ]);
      prisma.notification.findFirst.mockResolvedValue(null); // No recent notifications

      const sendSpy = jest.spyOn(service, 'sendNotification').mockResolvedValue(null as any);

      await service.runAlertChecks(10);

      expect(sendSpy).toHaveBeenCalledWith(
        2,
        'stock_low',
        'Apple iPad (SKU-APPLE) has only 2 units remaining (threshold: 5)',
        10,
        { sku: 'SKU-APPLE', amount: 2, link: '/inventory' },
      );
    });

    it('should bypass stock low alert if alert has been sent within the hour', async () => {
      prisma.stockEntry.groupBy.mockResolvedValue([
        { productId: 5, _sum: { quantity: new Decimal(2) } },
      ]);
      prisma.product.findMany.mockResolvedValue([
        { id: 5, name: 'Apple iPad', sku: 'SKU-APPLE', alertQuantity: 5 },
      ]);
      prisma.notification.findFirst.mockResolvedValue({ id: 1 }); // Already sent recently

      const sendSpy = jest.spyOn(service, 'sendNotification');

      await service.runAlertChecks(10);

      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should trigger payment overdue alert for sales and purchases older than 30 days', async () => {
      prisma.stockEntry.groupBy.mockResolvedValue([]);
      prisma.product.findMany.mockResolvedValue([]);
      prisma.purchaseLine.findMany.mockResolvedValue([]);

      prisma.sale.findMany.mockResolvedValue([
        {
          id: 1,
          invoiceNo: 'SALE-101',
          totalAmount: new Decimal(100),
          paidAmount: new Decimal(20),
        },
      ]);
      prisma.purchase.findMany.mockResolvedValue([
        { id: 2, refNo: 'PUR-102', totalAmount: new Decimal(200), paidAmount: new Decimal(50) },
      ]);
      prisma.notification.findFirst.mockResolvedValue(null);

      const sendSpy = jest.spyOn(service, 'sendNotification').mockResolvedValue(null as any);

      await service.runAlertChecks(10);

      expect(sendSpy).toHaveBeenCalledWith(
        2,
        'payment_due',
        'Payment of 80.00 is overdue for Sale Invoice #SALE-101 (Total: 100)',
        10,
        { amount: 80, invoiceNo: 'SALE-101', link: '/sales/1' },
      );

      expect(sendSpy).toHaveBeenCalledWith(
        2,
        'payment_due',
        'Payment of 150.00 is overdue for Purchase Reference #PUR-102 (Total: 200)',
        10,
        { amount: 150, refNo: 'PUR-102', link: '/purchases/2' },
      );
    });

    it('should trigger expiry alerts for purchase lines expiring in <= 7 days', async () => {
      prisma.stockEntry.groupBy.mockResolvedValue([]);
      prisma.product.findMany.mockResolvedValue([]);
      prisma.sale.findMany.mockResolvedValue([]);
      prisma.purchase.findMany.mockResolvedValue([]);

      prisma.purchaseLine.findMany.mockResolvedValue([
        {
          id: 50,
          batchNumber: 'B123',
          quantity: new Decimal(10),
          quantitySold: new Decimal(2),
          quantityAdjusted: new Decimal(1),
          expiryDate: new Date('2026-06-25T00:00:00Z'),
          product: { name: 'Milk Pro', sku: 'SKU-MILK' },
          purchase: { refNo: 'PUR-123' },
        },
      ]);
      prisma.notification.findFirst.mockResolvedValue(null);

      const sendSpy = jest.spyOn(service, 'sendNotification').mockResolvedValue(null as any);

      await service.runAlertChecks(10);

      expect(sendSpy).toHaveBeenCalledWith(
        2,
        'expiry_alert',
        'Milk Pro (SKU-MILK) - Batch B123 is expiring on 2026-06-25 (7 units remaining)',
        10,
        { sku: 'SKU-MILK', amount: 7, link: '/inventory' },
      );
    });
  });

  describe('markAsRead and unread checks', () => {
    it('should count unread notifications', async () => {
      prisma.notification.count.mockResolvedValue(4);
      const count = await service.getUnreadCount(1, 10);
      expect(count).toBe(4);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 1, businessId: 10, isRead: false },
      });
    });

    it('should mark single notification as read', async () => {
      const mockNotification = { id: 9, isRead: false };
      prisma.notification.findFirst.mockResolvedValue(mockNotification);
      prisma.notification.update.mockResolvedValue({ id: 9, isRead: true });

      await service.markAsRead(9, 1, 10);

      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 9, userId: 1, businessId: 10 },
      });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: { isRead: true },
      });
    });

    it('should throw NotFoundException if marking non-existent notification as read', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);
      await expect(service.markAsRead(9, 1, 10)).rejects.toThrow(NotFoundException);
    });
  });
});
