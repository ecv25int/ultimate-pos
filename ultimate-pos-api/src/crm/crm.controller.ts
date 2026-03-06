import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  Query, Req, UseGuards,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateCampaignDto, CreateScheduleDto, UpdateScheduleDto, CreateCallLogDto } from './dto/crm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('api/crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.crmService.getDashboard(req.user.businessId);
  }

  // ─── Campaigns ─────────────────────────────────────────────────────────────

  @Get('campaigns')
  getCampaigns(@Req() req: any) {
    return this.crmService.getCampaigns(req.user.businessId);
  }

  @Post('campaigns')
  createCampaign(@Req() req: any, @Body() dto: CreateCampaignDto) {
    return this.crmService.createCampaign(req.user.businessId, req.user.id, dto);
  }

  @Patch('campaigns/:id/status')
  updateCampaignStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.crmService.updateCampaignStatus(req.user.businessId, id, status);
  }

  @Delete('campaigns/:id')
  deleteCampaign(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.crmService.deleteCampaign(req.user.businessId, id);
  }

  // ─── Schedules ─────────────────────────────────────────────────────────────

  @Get('schedules')
  getSchedules(
    @Req() req: any,
    @Query('contactId') contactId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.crmService.getSchedules(req.user.businessId, {
      contactId: contactId ? parseInt(contactId, 10) : undefined,
      status,
      type,
    });
  }

  @Post('schedules')
  createSchedule(@Req() req: any, @Body() dto: CreateScheduleDto) {
    return this.crmService.createSchedule(req.user.businessId, req.user.id, dto);
  }

  @Patch('schedules/:id')
  updateSchedule(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.crmService.updateSchedule(req.user.businessId, id, dto);
  }

  @Delete('schedules/:id')
  deleteSchedule(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.crmService.deleteSchedule(req.user.businessId, id);
  }

  // ─── Call Logs ─────────────────────────────────────────────────────────────

  @Get('call-logs')
  getCallLogs(
    @Req() req: any,
    @Query('contactId') contactId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.crmService.getCallLogs(req.user.businessId, {
      contactId: contactId ? parseInt(contactId, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : undefined,
    });
  }

  @Post('call-logs')
  createCallLog(@Req() req: any, @Body() dto: CreateCallLogDto) {
    return this.crmService.createCallLog(req.user.businessId, req.user.id, dto);
  }

  @Delete('call-logs/:id')
  deleteCallLog(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.crmService.deleteCallLog(req.user.businessId, id);
  }
}
