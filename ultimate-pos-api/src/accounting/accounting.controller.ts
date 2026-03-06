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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { AccountingService } from './accounting.service';
import { CreateAccountTypeDto } from './dto/create-account-type.dto';
import { CreateAccountDto, UpdateAccountDto } from './dto/create-account.dto';
import { CreateAccountTransactionDto } from './dto/create-account-transaction.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ─── Account Types ────────────────────────────────────────────────

  /** POST /api/accounting/account-types */
  @Post('account-types')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createAccountType(@Req() req: any, @Body() dto: CreateAccountTypeDto) {
    return this.accountingService.createAccountType(req.user.businessId, req.user.id, dto);
  }

  /** GET /api/accounting/account-types */
  @Get('account-types')
  getAccountTypes(@Req() req: any) {
    return this.accountingService.getAccountTypes(req.user.businessId);
  }

  /** DELETE /api/accounting/account-types/:id */
  @Delete('account-types/:id')
  @Roles(UserRole.ADMIN)
  deleteAccountType(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.accountingService.deleteAccountType(req.user.businessId, id);
  }

  // ─── Accounts (Chart of Accounts) ────────────────────────────────

  /** POST /api/accounting/accounts */
  @Post('accounts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createAccount(@Req() req: any, @Body() dto: CreateAccountDto) {
    return this.accountingService.createAccount(req.user.businessId, req.user.id, dto);
  }

  /** GET /api/accounting/accounts?includeBalance=true */
  @Get('accounts')
  getAccounts(@Req() req: any, @Query('includeBalance') includeBalance?: string) {
    return this.accountingService.getAccounts(req.user.businessId, includeBalance === 'true');
  }

  /** GET /api/accounting/accounts/:id */
  @Get('accounts/:id')
  getAccount(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.accountingService.getAccount(req.user.businessId, id);
  }

  /** PATCH /api/accounting/accounts/:id */
  @Patch('accounts/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateAccount(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountingService.updateAccount(req.user.businessId, id, dto);
  }

  /** DELETE /api/accounting/accounts/:id */
  @Delete('accounts/:id')
  @Roles(UserRole.ADMIN)
  deleteAccount(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.accountingService.deleteAccount(req.user.businessId, id);
  }

  // ─── Transactions (Ledger) ────────────────────────────────────────

  /** POST /api/accounting/transactions */
  @Post('transactions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createTransaction(@Req() req: any, @Body() dto: CreateAccountTransactionDto) {
    return this.accountingService.createTransaction(req.user.businessId, req.user.id, dto);
  }

  /** GET /api/accounting/transactions?accountId=&startDate=&endDate=&page=&limit= */
  @Get('transactions')
  getTransactions(
    @Req() req: any,
    @Query('accountId') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accountingService.getTransactions(
      req.user.businessId,
      accountId ? parseInt(accountId, 10) : undefined,
      startDate,
      endDate,
      page ? parseInt(page, 10) : 1,
      Math.min(limit ? parseInt(limit, 10) : 50, 100),
    );
  }

  /** DELETE /api/accounting/transactions/:id */
  @Delete('transactions/:id')
  @Roles(UserRole.ADMIN)
  deleteTransaction(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.accountingService.deleteTransaction(req.user.businessId, id);
  }

  // ─── Reports ──────────────────────────────────────────────────────

  /** GET /api/accounting/reports/trial-balance */
  @Get('reports/trial-balance')
  getTrialBalance(@Req() req: any) {
    return this.accountingService.getTrialBalance(req.user.businessId);
  }

  /** GET /api/accounting/reports/profit-loss?startDate=&endDate= */
  @Get('reports/profit-loss')
  getProfitLoss(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getProfitLoss(req.user.businessId, startDate, endDate);
  }

  /** GET /api/accounting/reports/balance-sheet */
  @Get('reports/balance-sheet')
  getBalanceSheet(@Req() req: any) {
    return this.accountingService.getBalanceSheet(req.user.businessId);
  }
}
