import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
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
  constructor(private readonly dashboardService: DashboardService) {}

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

    return this.dashboardService.getDashboardData(businessId, userId, role, parsedLocationId);
  }
}
