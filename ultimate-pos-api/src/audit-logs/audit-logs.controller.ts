import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogsService } from './audit-logs.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  /** GET /api/audit-logs */
  @Get()
  @ApiOperation({ summary: 'List audit log entries', description: 'Returns paginated audit log entries for the business.' })
  @ApiQuery({ name: 'entity', required: false, description: 'Filter by entity type (e.g. Sale, Purchase, Product)' })
  @ApiQuery({ name: 'action', required: false, enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW'] })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  @ApiResponse({ status: 200, description: 'Paginated { total, page, limit, totalPages, data[] }.' })
  findAll(
    @Req() req: any,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogsService.findAll(req.user.businessId, {
      entity,
      action,
      userId: userId ? +userId : undefined,
      page: page ? +page : 1,
      limit: Math.min(limit ? +limit : 30, 100),
    });
  }
}
