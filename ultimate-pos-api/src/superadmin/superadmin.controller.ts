import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { SuperadminService } from './superadmin.service';
import { CreatePackageDto, UpdatePackageDto, CreateSubscriptionDto, UpdateSubscriptionStatusDto } from './dto/superadmin.dto';

@Controller('api/superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SuperadminController {
  constructor(private svc: SuperadminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.svc.getDashboard();
  }

  // Packages
  @Get('packages')
  getPackages() {
    return this.svc.getPackages();
  }

  @Get('packages/:id')
  getPackage(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getPackage(id);
  }

  @Post('packages')
  createPackage(@Req() req: any, @Body() dto: CreatePackageDto) {
    return this.svc.createPackage(req.user.id, dto);
  }

  @Patch('packages/:id')
  updatePackage(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePackageDto) {
    return this.svc.updatePackage(id, dto);
  }

  @Delete('packages/:id')
  deletePackage(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deletePackage(id);
  }

  // Subscriptions
  @Get('subscriptions')
  getSubscriptions(@Query('businessId') businessId?: string) {
    return this.svc.getSubscriptions(businessId ? Number(businessId) : undefined);
  }

  @Get('subscriptions/:id')
  getSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getSubscription(id);
  }

  @Post('subscriptions')
  createSubscription(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    return this.svc.createSubscription(req.user.id, dto);
  }

  @Patch('subscriptions/:id/status')
  updateSubscriptionStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubscriptionStatusDto) {
    return this.svc.updateSubscriptionStatus(id, dto);
  }

  @Delete('subscriptions/:id')
  deleteSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteSubscription(id);
  }
}
