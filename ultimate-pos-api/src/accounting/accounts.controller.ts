import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/create-account.dto';

interface AuthenticatedRequest {
  user: {
    id: number;
    businessId: number;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount(req.user.businessId, req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('includeBalance') includeBalance?: string) {
    return this.accountsService.getAccounts(req.user.businessId, includeBalance === 'true');
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.accountsService.getAccount(req.user.businessId, id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount(req.user.businessId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  deactivate(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.accountsService.deactivateAccount(id, req.user.businessId);
  }

  @Post('seed')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  seed(@Req() req: AuthenticatedRequest) {
    return this.accountsService.seedStandardAccounts(req.user.businessId, req.user.id);
  }
}
