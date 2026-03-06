import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaxRatesService } from './tax-rates.service';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { SetGroupSubTaxesDto } from './dto/set-group-sub-taxes.dto';

@UseGuards(JwtAuthGuard)
@Controller('tax-rates')
export class TaxRatesController {
  constructor(private readonly taxRatesService: TaxRatesService) {}

  /** POST /api/tax-rates */
  @Post()
  create(@Req() req: any, @Body() dto: CreateTaxRateDto) {
    return this.taxRatesService.create(req.user.businessId, req.user.id, dto);
  }

  /** GET /api/tax-rates */
  @Get()
  findAll(
    @Req() req: any,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.taxRatesService.findAll(
      req.user.businessId,
      includeInactive === 'true',
    );
  }

  /** GET /api/tax-rates/:id */
  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.taxRatesService.findOne(req.user.businessId, id);
  }

  /** GET /api/tax-rates/:id/with-sub-taxes */
  @Get(':id/with-sub-taxes')
  getWithSubTaxes(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.taxRatesService.getWithSubTaxes(req.user.businessId, id);
  }

  /** PATCH /api/tax-rates/:id */
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaxRateDto,
  ) {
    return this.taxRatesService.update(req.user.businessId, id, dto);
  }

  /** DELETE /api/tax-rates/:id */
  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.taxRatesService.remove(req.user.businessId, id);
  }

  // ─── Group Sub-Tax Endpoints ─────────────────────────────────────────────────

  /** GET /api/tax-rates/:id/sub-taxes — list sub-taxes of a group */
  @Get(':id/sub-taxes')
  getSubTaxes(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.taxRatesService.getSubTaxes(req.user.businessId, id);
  }

  /** PUT /api/tax-rates/:id/sub-taxes — replace all sub-taxes */
  @Put(':id/sub-taxes')
  setSubTaxes(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetGroupSubTaxesDto,
  ) {
    return this.taxRatesService.setSubTaxes(req.user.businessId, id, dto);
  }

  /** POST /api/tax-rates/:id/sub-taxes/:taxId — add a sub-tax */
  @Post(':id/sub-taxes/:taxId')
  addSubTax(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('taxId', ParseIntPipe) taxId: number,
  ) {
    return this.taxRatesService.addSubTax(req.user.businessId, id, taxId);
  }

  /** DELETE /api/tax-rates/:id/sub-taxes/:taxId — remove a sub-tax */
  @Delete(':id/sub-taxes/:taxId')
  removeSubTax(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('taxId', ParseIntPipe) taxId: number,
  ) {
    return this.taxRatesService.removeSubTax(req.user.businessId, id, taxId);
  }
}
