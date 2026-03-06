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
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('units')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Request() req: any, @Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(
      req.user.id,
      req.user.businessId,
      createUnitDto,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findAll(@Request() req: any, @Query('onlyBaseUnits') onlyBaseUnits?: string) {
    const onlyBase = onlyBaseUnits === 'true';
    return this.unitsService.findAll(req.user.businessId, onlyBase);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.unitsService.findOne(id, req.user.businessId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.unitsService.update(id, req.user.businessId, updateUnitDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.unitsService.remove(id, req.user.businessId);
  }
}
