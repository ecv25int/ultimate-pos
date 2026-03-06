import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResTableDto, UpdateResTableDto, CreateBookingDto, UpdateBookingDto } from './dto/restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  // ─── Tables ────────────────────────────────────────────────────────────────

  async getTables(businessId: number) {
    return this.prisma.resTable.findMany({
      where: { businessId },
      include: { bookings: { where: { bookingStatus: 'booked' }, select: { id: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createTable(businessId: number, userId: number, dto: CreateResTableDto) {
    return this.prisma.resTable.create({
      data: {
        businessId,
        locationId: dto.locationId,
        name: dto.name,
        description: dto.description ?? null,
        capacity: dto.capacity ?? 4,
        createdBy: userId,
      },
    });
  }

  async updateTable(businessId: number, id: number, dto: UpdateResTableDto) {
    await this.ensureTableExists(businessId, id);
    return this.prisma.resTable.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.locationId !== undefined && { locationId: dto.locationId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async deleteTable(businessId: number, id: number) {
    await this.ensureTableExists(businessId, id);
    await this.prisma.resTable.delete({ where: { id } });
    return { success: true };
  }

  private async ensureTableExists(businessId: number, id: number) {
    const table = await this.prisma.resTable.findFirst({ where: { id, businessId } });
    if (!table) throw new NotFoundException(`Table ${id} not found`);
    return table;
  }

  // ─── Bookings ──────────────────────────────────────────────────────────────

  async getBookings(businessId: number, filters: { date?: string; status?: string; locationId?: number }) {
    const where: Record<string, unknown> = { businessId };
    if (filters.status) where['bookingStatus'] = filters.status;
    if (filters.locationId) where['locationId'] = filters.locationId;
    if (filters.date) {
      const day = new Date(filters.date);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      where['bookingStart'] = { gte: day, lt: next };
    }
    return this.prisma.booking.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, mobile: true } },
        table: { select: { id: true, name: true, capacity: true } },
      },
      orderBy: { bookingStart: 'asc' },
    });
  }

  async createBooking(businessId: number, userId: number, dto: CreateBookingDto) {
    if (dto.tableId) {
      const conflict = await this.prisma.booking.findFirst({
        where: {
          tableId: dto.tableId,
          businessId,
          bookingStatus: 'booked',
          bookingStart: { lt: new Date(dto.bookingEnd) },
          bookingEnd: { gt: new Date(dto.bookingStart) },
        },
      });
      if (conflict) throw new BadRequestException('Table already booked for this time slot');
    }
    return this.prisma.booking.create({
      data: {
        businessId,
        locationId: dto.locationId,
        contactId: dto.contactId,
        tableId: dto.tableId ?? null,
        waiterId: dto.waiterId ?? null,
        bookingStart: new Date(dto.bookingStart),
        bookingEnd: new Date(dto.bookingEnd),
        bookingStatus: 'booked',
        bookingNote: dto.bookingNote ?? null,
        guestCount: dto.guestCount ?? 1,
        createdBy: userId,
      },
    });
  }

  async updateBooking(businessId: number, id: number, dto: UpdateBookingDto) {
    const booking = await this.prisma.booking.findFirst({ where: { id, businessId } });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    return this.prisma.booking.update({
      where: { id },
      data: {
        ...(dto.tableId !== undefined && { tableId: dto.tableId }),
        ...(dto.waiterId !== undefined && { waiterId: dto.waiterId }),
        ...(dto.bookingStart !== undefined && { bookingStart: new Date(dto.bookingStart) }),
        ...(dto.bookingEnd !== undefined && { bookingEnd: new Date(dto.bookingEnd) }),
        ...(dto.bookingStatus !== undefined && { bookingStatus: dto.bookingStatus }),
        ...(dto.bookingNote !== undefined && { bookingNote: dto.bookingNote }),
        ...(dto.guestCount !== undefined && { guestCount: dto.guestCount }),
      },
    });
  }

  async deleteBooking(businessId: number, id: number) {
    const booking = await this.prisma.booking.findFirst({ where: { id, businessId } });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    await this.prisma.booking.delete({ where: { id } });
    return { success: true };
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(businessId: number) {
    const tables = await this.prisma.resTable.findMany({ where: { businessId } });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayBookings = await this.prisma.booking.count({
      where: { businessId, bookingStart: { gte: todayStart, lt: todayEnd } },
    });
    const activeBookings = await this.prisma.booking.count({
      where: { businessId, bookingStatus: 'booked' },
    });

    const byStatus = tables.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalTables: tables.length,
      byStatus,
      todayBookings,
      activeBookings,
    };
  }
}
