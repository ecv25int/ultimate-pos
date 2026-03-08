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
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CreateBusinessLocationDto } from './dto/create-business-location.dto';
import { UpdateBusinessLocationDto } from './dto/update-business-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBusinessDto: CreateBusinessDto, @Request() req: any) {
    return this.businessService.create(createBusinessDto, req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  findAll() {
    return this.businessService.findAll();
  }

  @Get('my-business')
  getMyBusiness(@Request() req: any) {
    return this.businessService.getMyBusiness(req.user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @Request() req: any,
  ) {
    return this.businessService.update(+id, updateBusinessDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.businessService.remove(+id, req.user.id);
  }

  // ─── Business Locations ───────────────────────────────────────────────────

  @Get('locations/list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getLocations(@Request() req: any) {
    return this.businessService.getLocations(req.user.businessId);
  }

  @Post('locations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  createLocation(
    @Body() dto: CreateBusinessLocationDto,
    @Request() req: any,
  ) {
    return this.businessService.createLocation(req.user.businessId, dto);
  }

  @Get('locations/:locationId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getLocation(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Request() req: any,
  ) {
    return this.businessService.getLocation(locationId, req.user.businessId);
  }

  @Patch('locations/:locationId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateLocation(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: UpdateBusinessLocationDto,
    @Request() req: any,
  ) {
    return this.businessService.updateLocation(locationId, req.user.businessId, dto);
  }

  @Delete('locations/:locationId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  removeLocation(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Request() req: any,
  ) {
    return this.businessService.removeLocation(locationId, req.user.businessId);
  }
}
