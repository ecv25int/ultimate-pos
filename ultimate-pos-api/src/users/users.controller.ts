import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import {
  ChangeUserPasswordDto,
  CreateUserDto,
  UpdateUserDto,
} from './dto/user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /api/users/summary */
  @Get('summary')
  getSummary(@Req() req: any) {
    return this.usersService.getSummary(req.user.businessId);
  }

  /** GET /api/users */
  @Get()
  findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('userType') userType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll(req.user.businessId, {
      search,
      userType,
      page: page ? parseInt(page) : undefined,
      limit: limit ? Math.min(parseInt(limit), 100) : undefined,
    });
  }

  /** GET /api/users/:id */
  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(req.user.businessId, id);
  }

  /** POST /api/users */
  @Post()
  create(@Req() req: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(req.user.businessId, dto);
  }

  /** PATCH /api/users/:id */
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.businessId, id, dto);
  }

  /** POST /api/users/:id/change-password */
  @Post(':id/change-password')
  changePassword(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeUserPasswordDto,
  ) {
    return this.usersService.changePassword(req.user.businessId, id, dto);
  }

  /** POST /api/users/:id/toggle-active */
  @Post(':id/toggle-active')
  toggleActive(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleActive(
      req.user.businessId,
      id,
      req.user.id,
    );
  }

  /** DELETE /api/users/:id */
  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(req.user.businessId, id, req.user.id);
  }
}
