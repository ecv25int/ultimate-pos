import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BarcodeService } from './barcode.service';
import { CreateBarcodeLabelDto } from './dto/create-barcode-label.dto';
import { UpdateBarcodeLabelDto } from './dto/update-barcode-label.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('barcode')
export class BarcodeController {
  constructor(private readonly service: BarcodeService) {}

  // ── Label management ──────────────────────────────────────────────────────

  @Get('labels')
  findAllLabels(@Req() req: any) {
    return this.service.findAllLabels(req.user.businessId);
  }

  @Get('labels/:id')
  findOneLabel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOneLabel(id, req.user.businessId);
  }

  @Post('labels')
  createLabel(@Req() req: any, @Body() dto: CreateBarcodeLabelDto) {
    return this.service.createLabel(req.user.businessId, dto);
  }

  @Patch('labels/:id')
  updateLabel(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBarcodeLabelDto,
  ) {
    return this.service.updateLabel(id, req.user.businessId, dto);
  }

  @Delete('labels/:id')
  removeLabel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.removeLabel(id, req.user.businessId);
  }

  // ── Generation ────────────────────────────────────────────────────────────

  @Get('generate')
  generate(
    @Req() req: any,
    @Query('productId', ParseIntPipe) productId: number,
    @Query('labelId') labelId?: string,
  ) {
    return this.service.generateForProduct(
      req.user.businessId,
      productId,
      labelId ? Number(labelId) : undefined,
    );
  }
}
