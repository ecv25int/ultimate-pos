import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { NotificationTemplatesService } from './notification-templates.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('notification-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationTemplatesController {
  constructor(private readonly service: NotificationTemplatesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Request() req: any, @Body() dto: CreateNotificationTemplateDto) {
    return this.service.create(req.user.businessId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.businessId);
  }

  @Get('by-event')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findByEvent(@Request() req: any, @Query('event') event: string) {
    return this.service.findByEvent(req.user.businessId, event);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.findOne(id, req.user.businessId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.service.update(id, req.user.businessId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.remove(id, req.user.businessId);
  }
}
