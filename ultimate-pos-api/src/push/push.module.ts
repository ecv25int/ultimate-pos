import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { WebPushService } from './web-push.service';
import { PushController } from './push.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PushController],
  providers: [WebPushService],
  exports: [WebPushService],
})
export class PushModule {}
