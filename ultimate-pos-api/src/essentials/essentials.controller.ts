import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { EssentialsService } from './essentials.service';
import {
  CreateLeaveTypeDto, CreateLeaveDto, UpdateLeaveStatusDto,
  CreatePayrollDto, CreateDocumentDto, CreateReminderDto,
} from './dto/essentials.dto';

@Controller('api/essentials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class EssentialsController {
  constructor(private svc: EssentialsService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.svc.getDashboard(req.user.businessId, req.user.id);
  }

  // Leave Types
  @Get('leave-types')
  getLeaveTypes(@Req() req: any) {
    return this.svc.getLeaveTypes(req.user.businessId);
  }

  @Post('leave-types')
  createLeaveType(@Req() req: any, @Body() dto: CreateLeaveTypeDto) {
    return this.svc.createLeaveType(req.user.businessId, dto);
  }

  @Delete('leave-types/:id')
  deleteLeaveType(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteLeaveType(id, req.user.businessId);
  }

  // Leaves
  @Get('leaves')
  getLeaves(@Req() req: any, @Query('userId') userId?: string, @Query('status') status?: string) {
    return this.svc.getLeaves(req.user.businessId, userId ? Number(userId) : undefined, status);
  }

  @Post('leaves')
  createLeave(@Req() req: any, @Body() dto: CreateLeaveDto) {
    return this.svc.createLeave(req.user.businessId, dto);
  }

  @Patch('leaves/:id/status')
  updateLeaveStatus(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeaveStatusDto) {
    return this.svc.updateLeaveStatus(id, req.user.businessId, dto);
  }

  @Delete('leaves/:id')
  deleteLeave(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteLeave(id, req.user.businessId);
  }

  // Payrolls
  @Get('payrolls')
  getPayrolls(@Req() req: any, @Query('userId') userId?: string) {
    return this.svc.getPayrolls(req.user.businessId, userId ? Number(userId) : undefined);
  }

  @Post('payrolls')
  createPayroll(@Req() req: any, @Body() dto: CreatePayrollDto) {
    return this.svc.createPayroll(req.user.businessId, req.user.id, dto);
  }

  @Delete('payrolls/:id')
  deletePayroll(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deletePayroll(id, req.user.businessId);
  }

  // Documents
  @Get('documents')
  getDocuments(@Req() req: any, @Query('userId') userId?: string) {
    return this.svc.getDocuments(req.user.businessId, userId ? Number(userId) : undefined);
  }

  @Post('documents')
  createDocument(@Req() req: any, @Body() dto: CreateDocumentDto) {
    return this.svc.createDocument(req.user.businessId, dto);
  }

  @Delete('documents/:id')
  deleteDocument(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteDocument(id, req.user.businessId);
  }

  // Reminders
  @Get('reminders')
  getReminders(@Req() req: any) {
    return this.svc.getReminders(req.user.businessId, req.user.id);
  }

  @Post('reminders')
  createReminder(@Req() req: any, @Body() dto: CreateReminderDto) {
    return this.svc.createReminder(req.user.businessId, req.user.id, dto);
  }

  @Delete('reminders/:id')
  deleteReminder(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteReminder(id, req.user.businessId);
  }
}
