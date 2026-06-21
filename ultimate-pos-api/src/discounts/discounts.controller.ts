import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ApplyDiscountDto, ValidateDiscountDto } from './dto/discount-actions.dto';
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

@Controller('discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscountsController {
  constructor(private readonly service: DiscountsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateDiscountDto) {
    return this.service.create(req.user.businessId, dto);
  }

  @Post('apply')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  apply(@Body() dto: ApplyDiscountDto) {
    return this.service.applyDiscount(dto.discountType, dto.discountValue, dto.items);
  }

  @Post(':id/validate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  validate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ValidateDiscountDto,
  ) {
    return this.service.validateDiscount(id, req.user.businessId, dto.reason, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findAll(@Request() req: AuthenticatedRequest) {
    return this.service.findAll(req.user.businessId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
    return this.service.findOne(id, req.user.businessId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateDiscountDto,
  ) {
    return this.service.update(id, req.user.businessId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
    return this.service.remove(id, req.user.businessId);
  }
}
