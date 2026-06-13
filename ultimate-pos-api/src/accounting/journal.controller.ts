import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JournalService } from './journal.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

interface AuthenticatedRequest {
  user: {
    id: number;
    businessId: number;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('journal-entries')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateJournalEntryDto) {
    return this.journalService.createJournalEntry(req.user.businessId, req.user.id, dto);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.journalService.getJournalEntry(req.user.businessId, id);
  }

  @Post(':id/post')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  post(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.journalService.postToLedger(req.user.businessId, id);
  }

  @Post(':id/reverse')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  reverse(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.journalService.reverseEntry(req.user.businessId, id, req.user.id);
  }
}
