/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantService } from './restaurant.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let prisma: any;

  const prismaMock = {
    resTable: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RestaurantService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Tables', () => {
    const businessId = 1;
    const userId = 42;

    it('should retrieve tables list', async () => {
      prisma.resTable.findMany.mockResolvedValue([{ id: 10, name: 'Table 1', capacity: 4 }]);
      const res = await service.getTables(businessId);
      expect(res).toEqual([{ id: 10, name: 'Table 1', capacity: 4 }]);
      expect(prisma.resTable.findMany).toHaveBeenCalled();
    });

    it('should create table', async () => {
      const dto = { locationId: 2, name: 'T1', capacity: 6 };
      prisma.resTable.create.mockResolvedValue({ id: 10, ...dto });

      const res = await service.createTable(businessId, userId, dto);
      expect(res.id).toBe(10);
      expect(prisma.resTable.create).toHaveBeenCalled();
    });

    it('should update table and throw NotFoundException if missing', async () => {
      prisma.resTable.findFirst.mockResolvedValue(null);
      await expect(service.updateTable(businessId, 99, { name: 'T2' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Bookings', () => {
    const businessId = 1;
    const userId = 42;

    it('should throw BadRequestException if table is already booked for time slot', async () => {
      const dto = {
        locationId: 2,
        contactId: 5,
        tableId: 10,
        bookingStart: '2026-06-21T18:00:00.000Z',
        bookingEnd: '2026-06-21T20:00:00.000Z',
        guestCount: 2,
      };

      // Simulates conflict exists
      prisma.booking.findFirst.mockResolvedValue({ id: 100 });

      await expect(service.createBooking(businessId, userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create booking if no conflicts exist', async () => {
      const dto = {
        locationId: 2,
        contactId: 5,
        tableId: 10,
        bookingStart: '2026-06-21T18:00:00.000Z',
        bookingEnd: '2026-06-21T20:00:00.000Z',
        guestCount: 2,
      };

      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.create.mockResolvedValue({ id: 101, ...dto });

      const res = await service.createBooking(businessId, userId, dto);
      expect(res.id).toBe(101);
      expect(prisma.booking.create).toHaveBeenCalled();
    });
  });
});
