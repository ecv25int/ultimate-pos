import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ExportService } from './export.service';
import { ScheduledReportService } from './scheduled-report.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [PrismaModule, AccountingModule],
  controllers: [ReportsController, ReportingController, DashboardController],
  providers: [
    ReportsService,
    ReportingService,
    DashboardService,
    ExportService,
    ScheduledReportService,
  ],
  exports: [
    ReportsService,
    ReportingService,
    DashboardService,
    ExportService,
    ScheduledReportService,
  ],
})
export class ReportsModule {}
