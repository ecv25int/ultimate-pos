import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { HmsService } from './hms.service';
import { CreateRoomTypeDto, CreateRoomDto, CreateExtraDto, CreateBookingLineDto } from './dto/hms.dto';

@Controller('api/hms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class HmsController {
  constructor(private svc: HmsService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.svc.getDashboard(req.user.businessId);
  }

  // Room Types
  @Get('room-types')
  getRoomTypes(@Req() req: any) {
    return this.svc.getRoomTypes(req.user.businessId);
  }

  @Post('room-types')
  createRoomType(@Req() req: any, @Body() dto: CreateRoomTypeDto) {
    return this.svc.createRoomType(req.user.businessId, req.user.id, dto);
  }

  @Delete('room-types/:id')
  deleteRoomType(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteRoomType(id, req.user.businessId);
  }

  // Rooms
  @Get('rooms')
  getRooms(@Req() req: any, @Query('roomTypeId') roomTypeId?: string) {
    return this.svc.getRooms(req.user.businessId, roomTypeId ? Number(roomTypeId) : undefined);
  }

  @Post('rooms')
  createRoom(@Body() dto: CreateRoomDto) {
    return this.svc.createRoom(dto);
  }

  @Delete('rooms/:id')
  deleteRoom(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteRoom(id);
  }

  // Extras
  @Get('extras')
  getExtras(@Req() req: any) {
    return this.svc.getExtras(req.user.businessId);
  }

  @Post('extras')
  createExtra(@Req() req: any, @Body() dto: CreateExtraDto) {
    return this.svc.createExtra(req.user.businessId, req.user.id, dto);
  }

  @Delete('extras/:id')
  deleteExtra(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteExtra(id, req.user.businessId);
  }

  // Booking Lines
  @Get('booking-lines/:transactionId')
  getBookingLines(@Param('transactionId', ParseIntPipe) transactionId: number) {
    return this.svc.getBookingLines(transactionId);
  }

  @Post('booking-lines')
  createBookingLine(@Body() dto: CreateBookingLineDto) {
    return this.svc.createBookingLine(dto);
  }
}
