import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CalculateCommissionDto, ProcessCommissionPaymentDto } from './dto/commission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

interface AuthenticatedRequest {
  user: {
    id: number;
    businessId: number;
  };
}

@Controller('commission')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get(':salesPersonId/calculate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async calculate(
    @Param('salesPersonId', ParseIntPipe) salesPersonId: number,
    @Request() req: AuthenticatedRequest,
    @Query() query: CalculateCommissionDto,
  ) {
    const fromDate = query.fromDate ? new Date(query.fromDate) : new Date(0);
    const toDate = query.toDate ? new Date(query.toDate) : new Date();
    return this.commissionService.calculateCommission(
      req.user.businessId,
      salesPersonId,
      fromDate,
      toDate,
      query.type,
      query.commissionRate,
    );
  }

  @Get(':salesPersonId/statement')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStatement(
    @Param('salesPersonId', ParseIntPipe) salesPersonId: number,
    @Request() req: AuthenticatedRequest,
    @Query() query: CalculateCommissionDto,
  ) {
    const fromDate = query.fromDate ? new Date(query.fromDate) : new Date(0);
    const toDate = query.toDate ? new Date(query.toDate) : new Date();
    return this.commissionService.getCommissionStatement(
      req.user.businessId,
      salesPersonId,
      fromDate,
      toDate,
      query.type,
      query.commissionRate,
    );
  }

  @Post('pay')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async pay(@Request() req: AuthenticatedRequest, @Body() dto: ProcessCommissionPaymentDto) {
    return this.commissionService.processCommissionPayment(req.user.businessId, req.user.id, dto);
  }
}
