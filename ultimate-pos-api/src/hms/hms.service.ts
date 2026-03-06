import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomTypeDto, CreateRoomDto, CreateExtraDto, CreateBookingLineDto } from './dto/hms.dto';

@Injectable()
export class HmsService {
  constructor(private prisma: PrismaService) {}

  // ---- Room Types ----
  async getRoomTypes(businessId: number) {
    return this.prisma.hmsRoomType.findMany({
      where: { businessId, deletedAt: null },
      include: { _count: { select: { rooms: true } } },
    });
  }

  async createRoomType(businessId: number, userId: number, dto: CreateRoomTypeDto) {
    return this.prisma.hmsRoomType.create({ data: { ...dto, businessId, createdBy: userId } });
  }

  async deleteRoomType(id: number, businessId: number) {
    const rt = await this.prisma.hmsRoomType.findFirst({ where: { id, businessId } });
    if (!rt) throw new NotFoundException();
    await this.prisma.hmsRoomType.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ---- Rooms ----
  async getRooms(businessId: number, roomTypeId?: number) {
    return this.prisma.hmsRoom.findMany({
      where: {
        deletedAt: null,
        roomType: { businessId },
        ...(roomTypeId && { hmsRoomTypeId: roomTypeId }),
      },
      include: { roomType: true },
    });
  }

  async createRoom(dto: CreateRoomDto) {
    return this.prisma.hmsRoom.create({ data: dto });
  }

  async deleteRoom(id: number) {
    await this.prisma.hmsRoom.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ---- Extras ----
  async getExtras(businessId: number) {
    return this.prisma.hmsExtra.findMany({ where: { businessId } });
  }

  async createExtra(businessId: number, userId: number, dto: CreateExtraDto) {
    return this.prisma.hmsExtra.create({ data: { ...dto, businessId, createdBy: userId } });
  }

  async deleteExtra(id: number, businessId: number) {
    await this.prisma.hmsExtra.deleteMany({ where: { id, businessId } });
    return { success: true };
  }

  // ---- Booking Lines ----
  async getBookingLines(transactionId: number) {
    return this.prisma.hmsBookingLine.findMany({
      where: { transactionId },
      include: { room: true, roomType: true },
    });
  }

  async createBookingLine(dto: CreateBookingLineDto) {
    return this.prisma.hmsBookingLine.create({ data: dto });
  }

  // ---- Dashboard ----
  async getDashboard(businessId: number) {
    const [totalRoomTypes, totalRooms, totalExtras] = await Promise.all([
      this.prisma.hmsRoomType.count({ where: { businessId, deletedAt: null } }),
      this.prisma.hmsRoom.count({ where: { deletedAt: null, roomType: { businessId } } }),
      this.prisma.hmsExtra.count({ where: { businessId, isActive: true } }),
    ]);
    return { totalRoomTypes, totalRooms, activeExtras: totalExtras };
  }
}
