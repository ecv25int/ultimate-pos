import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ImportExportService } from './import-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('import-export')
export class ImportExportController {
  constructor(private readonly service: ImportExportService) {}

  // ── Export endpoints ──────────────────────────────────────────────────────

  @Get('export/products')
  exportProducts(@Req() req: any) {
    return this.service.exportProducts(req.user.businessId);
  }

  @Get('export/contacts')
  exportContacts(@Req() req: any) {
    return this.service.exportContacts(req.user.businessId);
  }

  @Get('template')
  getTemplate(@Query('entity') entity: string) {
    return {
      entity,
      columns: this.service.getTemplate(entity as any),
    };
  }

  // ── Import endpoints ──────────────────────────────────────────────────────

  @Post('import/preview')
  previewImport(
    @Req() req: any,
    @Body() body: { entity: string; rows: Record<string, unknown>[] },
  ) {
    return this.service.previewImport(req.user.businessId, body.entity as any, body.rows);
  }

  @Post('import/commit')
  commitImport(
    @Req() req: any,
    @Body() body: { entity: string; rows: Record<string, unknown>[] },
  ) {
    return this.service.commitImport(
      req.user.businessId,
      body.entity as any,
      body.rows,
      req.user.id,
    );
  }
}
