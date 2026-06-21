/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { DiscountsService } from './discounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DiscountsService', () => {
  let service: DiscountsService;
  let prisma: any;
  let auditLogs: any;

  const prismaMock = {
    discount: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const auditLogsMock = {
    logActivity: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditLogsService, useValue: auditLogsMock },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
    prisma = module.get<PrismaService>(PrismaService);
    auditLogs = module.get<AuditLogsService>(AuditLogsService);
  });

  describe('applyDiscount', () => {
    const items = [
      { productId: 1, unitPrice: 100, quantity: 2 },
      { productId: 2, unitPrice: 50, quantity: 4 },
    ];

    it('should return 0 discount if items is empty', () => {
      const res = service.applyDiscount('percentage', 10, []);
      expect(res).toEqual({ discountAmount: 0, items: [] });
    });

    it('should calculate percentage discount correctly', () => {
      const res = service.applyDiscount('percentage', 10, items);
      expect(res.discountAmount).toBe(40);
      expect(res.items[0].discountAmount).toBe(20);
      expect(res.items[1].discountAmount).toBe(20);
    });

    it('should calculate fixed discount correctly distributing proportionally and rounding remainder', () => {
      const res = service.applyDiscount('fixed', 33.33, items);
      expect(res.discountAmount).toBe(33.33);
      expect(res.items[0].discountAmount).toBe(16.665);
      expect(res.items[1].discountAmount).toBe(16.665);
    });

    it('should calculate buy-X-get-Y discount correctly from string input', () => {
      const itemsBuyGet = [{ productId: 1, unitPrice: 100, quantity: 3 }];
      const res = service.applyDiscount('buy_x_get_y', '2:1', itemsBuyGet);
      expect(res.discountAmount).toBe(100);
      expect(res.items[0].discountAmount).toBe(100);
    });

    it('should calculate buy-X-get-Y discount correctly from object input', () => {
      const itemsBuyGet = [{ productId: 1, unitPrice: 50, quantity: 5 }];
      const res = service.applyDiscount('buy_x_get_y', { buyQty: 3, getQty: 2 }, itemsBuyGet);
      expect(res.discountAmount).toBe(100);
      expect(res.items[0].discountAmount).toBe(100);
    });
  });

  describe('validateDiscount', () => {
    const businessId = 1;
    const discountId = 10;
    const userId = 42;

    it('should throw BadRequestException if reason is invalid', async () => {
      await expect(
        service.validateDiscount(discountId, businessId, 'invalid_reason', userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if discount does not exist', async () => {
      prisma.discount.findFirst.mockResolvedValue(null);
      await expect(
        service.validateDiscount(discountId, businessId, 'promotion', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if discount is inactive', async () => {
      prisma.discount.findFirst.mockResolvedValue({
        id: discountId,
        businessId,
        isActive: false,
      });
      await expect(
        service.validateDiscount(discountId, businessId, 'promotion', userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if discount has not started yet', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);

      prisma.discount.findFirst.mockResolvedValue({
        id: discountId,
        businessId,
        isActive: true,
        startsAt: future,
      });
      await expect(
        service.validateDiscount(discountId, businessId, 'promotion', userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if discount has expired', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);

      prisma.discount.findFirst.mockResolvedValue({
        id: discountId,
        businessId,
        isActive: true,
        endsAt: past,
      });
      await expect(
        service.validateDiscount(discountId, businessId, 'promotion', userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return valid true and discount if successful and log activity', async () => {
      const discountMock = {
        id: discountId,
        businessId,
        isActive: true,
        startsAt: new Date(Date.now() - 10000),
        endsAt: new Date(Date.now() + 10000),
      };
      prisma.discount.findFirst.mockResolvedValue(discountMock);

      const res = await service.validateDiscount(discountId, businessId, 'loyalty', userId);
      expect(res).toEqual({ valid: true, discount: discountMock });
      expect(auditLogs.logActivity).toHaveBeenCalledWith(
        businessId,
        userId,
        'VIEW',
        'Discount',
        discountId,
        { reason: 'loyalty', message: expect.any(String) },
      );
    });
  });
});
