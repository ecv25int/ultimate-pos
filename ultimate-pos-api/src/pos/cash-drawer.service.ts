import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';

/** ESC/POS: kick pin-2 then pin-5 (covers drawer wired to either pin) */
const OPEN_DRAWER = Buffer.concat([
  Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xff]),
  Buffer.from([0x1b, 0x70, 0x01, 0x19, 0xff]),
]);

const TIMEOUT_MS = 2000;

@Injectable()
export class CashDrawerService {
  private readonly logger = new Logger(CashDrawerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * True when the business has a cash drawer host configured.
   */
  isConfigured(business: { cashDrawerHost: string | null }): boolean {
    return !!business.cashDrawerHost?.trim();
  }

  /**
   * Send the ESC/POS open-drawer command.
   * Uses TCP when cashDrawerPort is set, otherwise serial.
   * Fires-and-forgets; never throws — logs a warning on failure.
   */
  async open(businessId: number): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { cashDrawerHost: true, cashDrawerPort: true },
    });

    if (!business || !this.isConfigured(business)) {
      this.logger.debug(`Cash drawer not configured for business ${businessId}`);
      return;
    }

    const { cashDrawerHost, cashDrawerPort } = business;

    if (cashDrawerPort !== null) {
      await this.openViaTcp(cashDrawerHost!, cashDrawerPort);
    } else {
      await this.openViaSerial(cashDrawerHost!);
    }
  }

  private openViaTcp(host: string, port: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        this.logger.warn(`Cash drawer TCP timeout (${host}:${port})`);
        resolve();
      }, TIMEOUT_MS);

      socket.connect(port, host, () => {
        socket.write(OPEN_DRAWER, () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve();
        });
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        socket.destroy();
        this.logger.warn(`Cash drawer TCP error: ${err.message}`);
        resolve();
      });
    });
  }

  private openViaSerial(port: string): Promise<void> {
    return new Promise<void>((resolve) => {
      fs.open(port, 'w', (err, fd) => {
        if (err) {
          this.logger.warn(`Cash drawer serial open error (${port}): ${err.message}`);
          return resolve();
        }
        fs.write(fd, OPEN_DRAWER, 0, OPEN_DRAWER.length, null, (writeErr) => {
          if (writeErr) {
            this.logger.warn(`Cash drawer serial write error: ${writeErr.message}`);
          }
          fs.close(fd, () => resolve());
        });
      });
    });
  }
}
