import { Controller, Get, Post, Delete, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { WoocommerceService } from './woocommerce.service';
import { CreateSyncLogDto } from './dto/woocommerce.dto';

@Controller('api/woocommerce')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class WoocommerceController {
  constructor(private svc: WoocommerceService) {}

  @Get('stats')
  getStats(@Req() req: any) {
    return this.svc.getStats(req.user.businessId);
  }

  @Get('sync-logs')
  getSyncLogs(@Req() req: any, @Query('syncType') syncType?: string) {
    return this.svc.getSyncLogs(req.user.businessId, syncType);
  }

  @Post('sync-logs')
  createSyncLog(@Req() req: any, @Body() dto: CreateSyncLogDto) {
    return this.svc.createSyncLog(req.user.businessId, req.user.id, dto);
  }

  @Delete('sync-logs')
  clearSyncLogs(@Req() req: any) {
    return this.svc.clearSyncLogs(req.user.businessId);
  }
}
