import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsService } from './sms.service';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PrismaModule, ConfigModule, PushModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmsService],
  exports: [NotificationsService, SmsService],
})
export class NotificationsModule {}
