import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { SellingPriceGroupsService } from './selling-price-groups.service';
import { CreateSellingPriceGroupDto } from './dto/create-selling-price-group.dto';
import { UpdateSellingPriceGroupDto } from './dto/update-selling-price-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('selling-price-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellingPriceGroupsController {
  constructor(private readonly service: SellingPriceGroupsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Request() req: any, @Body() dto: CreateSellingPriceGroupDto) {
    return this.service.create(req.user.businessId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.businessId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.findOne(id, req.user.businessId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: UpdateSellingPriceGroupDto,
  ) {
    return this.service.update(id, req.user.businessId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.remove(id, req.user.businessId);
  }
}
