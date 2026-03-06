import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  Query, Req, UseGuards,
} from '@nestjs/common';
import { RepairService } from './repair.service';
import { CreateRepairStatusDto, CreateDeviceModelDto, CreateJobSheetDto, UpdateJobSheetDto } from './dto/repair.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('api/repair')
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.repairService.getDashboard(req.user.businessId);
  }

  // Statuses
  @Get('statuses')
  getStatuses(@Req() req: any) {
    return this.repairService.getStatuses(req.user.businessId);
  }

  @Post('statuses')
  createStatus(@Req() req: any, @Body() dto: CreateRepairStatusDto) {
    return this.repairService.createStatus(req.user.businessId, dto);
  }

  @Delete('statuses/:id')
  deleteStatus(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.repairService.deleteStatus(req.user.businessId, id);
  }

  // Device Models
  @Get('device-models')
  getDeviceModels(@Req() req: any) {
    return this.repairService.getDeviceModels(req.user.businessId);
  }

  @Post('device-models')
  createDeviceModel(@Req() req: any, @Body() dto: CreateDeviceModelDto) {
    return this.repairService.createDeviceModel(req.user.businessId, req.user.id, dto);
  }

  @Delete('device-models/:id')
  deleteDeviceModel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.repairService.deleteDeviceModel(req.user.businessId, id);
  }

  // Job Sheets
  @Get('job-sheets')
  getJobSheets(
    @Req() req: any,
    @Query('statusId') statusId?: string,
    @Query('contactId') contactId?: string,
  ) {
    return this.repairService.getJobSheets(req.user.businessId, {
      statusId: statusId ? parseInt(statusId, 10) : undefined,
      contactId: contactId ? parseInt(contactId, 10) : undefined,
    });
  }

  @Get('job-sheets/:id')
  getJobSheet(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.repairService.getJobSheet(req.user.businessId, id);
  }

  @Post('job-sheets')
  createJobSheet(@Req() req: any, @Body() dto: CreateJobSheetDto) {
    return this.repairService.createJobSheet(req.user.businessId, req.user.id, dto);
  }

  @Patch('job-sheets/:id')
  updateJobSheet(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobSheetDto,
  ) {
    return this.repairService.updateJobSheet(req.user.businessId, id, dto);
  }

  @Delete('job-sheets/:id')
  deleteJobSheet(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.repairService.deleteJobSheet(req.user.businessId, id);
  }
}
