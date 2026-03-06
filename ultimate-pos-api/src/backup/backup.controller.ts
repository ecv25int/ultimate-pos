import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { BackupService } from './backup.service';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BackupController {
  constructor(private readonly backup: BackupService) {}

  /** GET /backup — list all available backup files */
  @Get()
  list() {
    return this.backup.listBackups();
  }

  /** GET /backup/download — create a fresh backup and stream it as .sql.gz */
  @Get('download')
  async download(@Res({ passthrough: true }) res: Response) {
    const { stream, filename } = await this.backup.streamBackup();
    res.set({
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return stream;
  }

  /** POST /backup/restore — upload a .sql.gz file and restore the database (staging only) */
  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
      fileFilter: (_req, file, cb) => {
        if (file.originalname.endsWith('.sql.gz') || file.mimetype === 'application/gzip') {
          cb(null, true);
        } else {
          cb(new Error('Only .sql.gz files are accepted'), false);
        }
      },
    }),
  )
  async restore(@UploadedFile() file: Express.Multer.File) {
    await this.backup.restoreFromBuffer(file.buffer);
    return { restored: true };
  }
}
