import { Controller, Get, Query, Request, UseGuards, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';

interface AuthenticatedRequest {
  user: {
    businessId: number;
    id: number;
    userType: string;
  };
}

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get dashboard KPIs and analytical trends with role-based restrictions',
  })
  @ApiQuery({ name: 'locationId', required: false, type: Number })
  async getDashboard(
    @Request() req: AuthenticatedRequest,
    @Query('locationId') locationId?: string,
  ) {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    const role = req.user.userType;
    const parsedLocationId = locationId ? parseInt(locationId, 10) : undefined;

    const cacheKey = `dashboard_kpis_${businessId}_${userId}_${parsedLocationId ?? 'all'}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const data = await this.dashboardService.getDashboardData(businessId, userId, role, parsedLocationId);
    await this.cacheManager.set(cacheKey, data, 60_000); // 1 min
    return data;
  }
}
