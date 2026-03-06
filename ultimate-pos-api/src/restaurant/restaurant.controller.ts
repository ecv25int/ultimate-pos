import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  Query, Req, UseGuards,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateResTableDto, UpdateResTableDto, CreateBookingDto, UpdateBookingDto } from './dto/restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('api/restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.restaurantService.getDashboard(req.user.businessId);
  }

  // ─── Tables ────────────────────────────────────────────────────────────────

  @Get('tables')
  getTables(@Req() req: any) {
    return this.restaurantService.getTables(req.user.businessId);
  }

  @Post('tables')
  createTable(@Req() req: any, @Body() dto: CreateResTableDto) {
    return this.restaurantService.createTable(req.user.businessId, req.user.id, dto);
  }

  @Patch('tables/:id')
  updateTable(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResTableDto,
  ) {
    return this.restaurantService.updateTable(req.user.businessId, id, dto);
  }

  @Delete('tables/:id')
  deleteTable(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.restaurantService.deleteTable(req.user.businessId, id);
  }

  // ─── Bookings ──────────────────────────────────────────────────────────────

  @Get('bookings')
  getBookings(
    @Req() req: any,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.restaurantService.getBookings(req.user.businessId, {
      date,
      status,
      locationId: locationId ? parseInt(locationId, 10) : undefined,
    });
  }

  @Post('bookings')
  createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.restaurantService.createBooking(req.user.businessId, req.user.id, dto);
  }

  @Patch('bookings/:id')
  updateBooking(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.restaurantService.updateBooking(req.user.businessId, id, dto);
  }

  @Delete('bookings/:id')
  deleteBooking(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.restaurantService.deleteBooking(req.user.businessId, id);
  }
}
