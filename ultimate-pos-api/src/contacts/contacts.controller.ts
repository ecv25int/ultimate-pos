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
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Contacts')
@ApiBearerAuth('JWT')
@Controller('contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a contact', description: 'Creates a customer, supplier, or both.' })
  @ApiResponse({ status: 201, description: 'Contact created.' })
  create(@Request() req: any, @Body() dto: CreateContactDto) {
    return this.contactsService.create(req.user.id, req.user.businessId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'List contacts', description: 'Returns all contacts for the business. Filter by type (customer|supplier|both) and status.' })
  @ApiQuery({ name: 'type', required: false, enum: ['customer', 'supplier', 'both'] })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Array of contacts.' })
  findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.contactsService.findAll(
      req.user.businessId,
      type,
      status,
      search,
    );
  }

  /**
   * POST /api/contacts/import
   * Must be defined BEFORE @Get(':id') to avoid route conflict
   */
  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Import contacts', description: 'Bulk import contacts from a rows array (JSON body).' })
  @ApiResponse({ status: 200, description: 'Import summary.' })
  importContacts(
    @Request() req: any,
    @Body() dto: { rows: any[] },
  ) {
    return this.contactsService.importContacts(req.user.businessId, req.user.id, dto.rows);
  }

  /**
   * GET /api/contacts/export
   * Must be defined BEFORE @Get(':id') to avoid route conflict
   */
  @Get('export')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Export contacts to CSV', description: 'Downloads all contacts as a CSV file.' })
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  async exportCsv(@Request() req: any, @Res() res: Response) {
    const csv = await this.contactsService.exportToCsv(req.user.businessId);
    const filename = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.end(csv);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact details.' })
  @ApiResponse({ status: 404, description: 'Contact not found.' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.contactsService.findOne(id, req.user.businessId);
  }

  /** GET /api/contacts/:id/ledger */
  @Get(':id/ledger')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Contact ledger', description: 'Returns running balance ledger for a contact — sales, purchases, and payments.' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Ledger entries array.' })
  getLedger(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.contactsService.getLedger(id, req.user.businessId);
  }

  /** GET /api/contacts/:id/overdue */
  @Get(':id/overdue')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Contact overdue invoices', description: 'Returns unpaid/partially-paid sales and purchases for a contact.' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Overdue sales and purchases with owed totals.' })
  getOverdueInvoices(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.contactsService.getOverdueInvoices(id, req.user.businessId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Updated contact.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(id, req.user.businessId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation.' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.contactsService.remove(id, req.user.businessId);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle contact active/inactive status' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  toggleStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.contactsService.toggleStatus(id, req.user.businessId);
  }
}
