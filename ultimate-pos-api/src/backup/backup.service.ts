import {
  Injectable,
  Logger,
  StreamableFile,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createWriteStream, createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createInterface } from 'readline';
import { Readable } from 'stream';
import { Request } from 'express';

export interface BackupMeta {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(private config: ConfigService) {
    this.backupDir = join(process.cwd(), 'backups');
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // ─── Scheduled daily backup at 02:00 server time ───────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup(): Promise<void> {
    this.logger.log('Running scheduled daily backup…');
    try {
      const { filePath } = await this.createBackupFile();
      this.logger.log(`Scheduled backup complete: ${filePath}`);
      this.pruneOldBackups(14); // keep last 14 days
    } catch (err: any) {
      this.logger.error(`Scheduled backup failed: ${err?.message}`);
    }
  }

  // ─── List backup files ──────────────────────────────────────────────────────
  listBackups(): BackupMeta[] {
    if (!existsSync(this.backupDir)) return [];
    return readdirSync(this.backupDir)
      .filter((f) => f.endsWith('.sql.gz'))
      .map((f) => {
        const full = join(this.backupDir, f);
        const stat = statSync(full);
        return { filename: f, sizeBytes: stat.size, createdAt: stat.birthtime.toISOString() };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ─── Create backup and stream to caller ────────────────────────────────────
  async streamBackup(): Promise<{ stream: StreamableFile; filename: string }> {
    const { filePath, filename } = await this.createBackupFile();
    const readable = createReadStream(filePath);
    return { stream: new StreamableFile(readable), filename };
  }

  // ─── Restore from .sql.gz buffer (STAGING ONLY) ────────────────────────────
  async restoreFromBuffer(buffer: Buffer): Promise<void> {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'production');
    if (nodeEnv === 'production') {
      throw new BadRequestException('Restore is disabled in production. Use a staging environment.');
    }

    const { host, port, user, password, name } = this.getDbConfig();

    await new Promise<void>((resolve, reject) => {
      const mysql = spawn('mysql', [
        `-h${host}`,
        `-P${port}`,
        `-u${user}`,
        `--password=${password}`,
        name,
      ]);

      const gunzip = createGunzip();
      const source = Readable.from(buffer);

      mysql.on('error', reject);
      mysql.stderr.on('data', (d) => this.logger.warn(`mysql stderr: ${d}`));
      mysql.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new InternalServerErrorException(`mysql exited with code ${code}`));
      });

      pipeline(source, gunzip, mysql.stdin).catch(reject);
    });

    this.logger.log('Database restore completed');
  }

  // ─── Internals ──────────────────────────────────────────────────────────────
  private async createBackupFile(): Promise<{ filePath: string; filename: string }> {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${ts}.sql.gz`;
    const filePath = join(this.backupDir, filename);

    const { host, port, user, password, name } = this.getDbConfig();

    await new Promise<void>((resolve, reject) => {
      const dump = spawn('mysqldump', [
        `-h${host}`,
        `-P${port}`,
        `-u${user}`,
        `--password=${password}`,
        '--single-transaction',
        '--routines',
        '--triggers',
        name,
      ]);

      const gzip = createGzip();
      const out = createWriteStream(filePath);

      dump.on('error', reject);
      dump.stderr.on('data', (d) => this.logger.warn(`mysqldump: ${d}`));
      dump.on('close', (code) => {
        if (code !== 0) reject(new InternalServerErrorException(`mysqldump exited with ${code}`));
      });

      pipeline(dump.stdout, gzip, out).then(resolve).catch(reject);
    });

    return { filePath, filename };
  }

  private getDbConfig() {
    const url = this.config.get<string>('DATABASE_URL') ?? '';
    // mysql://user:pass@host:port/dbname
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\S+)/);
    if (match) {
      return { user: match[1], password: match[2], host: match[3], port: match[4], name: match[5] };
    }
    // Fallback to individual env vars
    return {
      host: this.config.get<string>('DB_HOST', '127.0.0.1'),
      port: this.config.get<string>('DB_PORT', '3306'),
      user: this.config.get<string>('DB_USERNAME', 'root'),
      password: this.config.get<string>('DB_PASSWORD', ''),
      name: this.config.get<string>('DB_DATABASE', 'ultimate_pos'),
    };
  }

  private pruneOldBackups(keepDays: number): void {
    const cutoff = Date.now() - keepDays * 24 * 3600 * 1000;
    readdirSync(this.backupDir)
      .filter((f) => f.endsWith('.sql.gz'))
      .forEach((f) => {
        const full = join(this.backupDir, f);
        if (statSync(full).birthtimeMs < cutoff) {
          unlinkSync(full);
          this.logger.debug(`Pruned old backup: ${f}`);
        }
      });
  }
}
