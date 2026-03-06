import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportSchedulerService } from './report-scheduler.service';
import { ReportSchedulerController } from './report-scheduler.controller';

@Module({
  imports: [PrismaModule, ConfigModule, ScheduleModule.forRoot()],
  controllers: [ReportSchedulerController],
  providers: [ReportSchedulerService],
})
export class ReportSchedulerModule {}
