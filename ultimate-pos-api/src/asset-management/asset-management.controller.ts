import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { AssetManagementService } from './asset-management.service';
import {
  CreateAssetDto,
  UpdateAssetDto,
  CreateAssetTransactionDto,
  CreateMaintenanceDto,
  CreateWarrantyDto,
} from './dto/asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('api/assets')
export class AssetManagementController {
  constructor(private readonly assetService: AssetManagementService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.assetService.getDashboard(req.user.businessId);
  }

  // Assets
  @Get()
  getAssets(@Req() req: any) {
    return this.assetService.getAssets(req.user.businessId);
  }

  @Get(':id')
  getAsset(@Req() req: any, @Param('id') id: string) {
    return this.assetService.getAsset(req.user.businessId, parseInt(id, 10));
  }

  @Post()
  createAsset(@Req() req: any, @Body() dto: CreateAssetDto) {
    return this.assetService.createAsset(req.user.businessId, req.user.id, dto);
  }

  @Patch(':id')
  updateAsset(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetService.updateAsset(req.user.businessId, parseInt(id, 10), dto);
  }

  @Delete(':id')
  deleteAsset(@Req() req: any, @Param('id') id: string) {
    return this.assetService.deleteAsset(req.user.businessId, parseInt(id, 10));
  }

  // Transactions
  @Get('transactions/list')
  getTransactions(@Req() req: any, @Query('assetId') assetId?: string) {
    return this.assetService.getTransactions(
      req.user.businessId,
      assetId ? parseInt(assetId, 10) : undefined,
    );
  }

  @Post('transactions/create')
  createTransaction(@Req() req: any, @Body() dto: CreateAssetTransactionDto) {
    return this.assetService.createTransaction(req.user.businessId, req.user.id, dto);
  }

  // Warranties
  @Post('warranties/create')
  createWarranty(@Req() req: any, @Body() dto: CreateWarrantyDto) {
    return this.assetService.createWarranty(req.user.businessId, dto);
  }

  @Delete('warranties/:id')
  deleteWarranty(@Param('id') id: string) {
    return this.assetService.deleteWarranty(parseInt(id, 10));
  }

  // Maintenances
  @Get('maintenances/list')
  getMaintenances(@Req() req: any, @Query('assetId') assetId?: string) {
    return this.assetService.getMaintenances(
      req.user.businessId,
      assetId ? parseInt(assetId, 10) : undefined,
    );
  }

  @Post('maintenances/create')
  createMaintenance(@Req() req: any, @Body() dto: CreateMaintenanceDto) {
    return this.assetService.createMaintenance(req.user.businessId, req.user.id, dto);
  }

  @Patch('maintenances/:id/status')
  updateMaintenanceStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.assetService.updateMaintenance(req.user.businessId, BigInt(id), status);
  }

  @Delete('maintenances/:id')
  deleteMaintenance(@Req() req: any, @Param('id') id: string) {
    return this.assetService.deleteMaintenance(req.user.businessId, BigInt(id));
  }
}
