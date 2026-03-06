import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsIn, IsArray, IsEmail, ArrayNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { ReportSchedulerService } from './report-scheduler.service';

class CreateScheduledReportDto {
  @IsString() @IsNotEmpty()
  name!: string;

  @IsIn(['sales_summary', 'profit_loss', 'inventory', 'expenses', 'contacts'])
  reportType!: 'sales_summary' | 'profit_loss' | 'inventory' | 'expenses' | 'contacts';

  @IsIn(['daily', 'weekly', 'monthly'])
  frequency!: 'daily' | 'weekly' | 'monthly';

  @IsArray() @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  recipients!: string[];
}

class UpdateScheduledReportDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsIn(['sales_summary', 'profit_loss', 'inventory', 'expenses', 'contacts'])
  reportType?: string;

  @IsOptional() @IsIn(['daily', 'weekly', 'monthly'])
  frequency?: string;

  @IsOptional() @IsArray() @IsEmail({}, { each: true })
  recipients?: string[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

@Controller('reports/schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class ReportSchedulerController {
  constructor(private readonly service: ReportSchedulerService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.businessId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(req.user.businessId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateScheduledReportDto) {
    return this.service.create(req.user.businessId, req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduledReportDto,
  ) {
    return this.service.update(req.user.businessId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user.businessId, id);
  }
}
