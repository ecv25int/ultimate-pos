import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum ReportType {
  TRIAL_BALANCE = 'trial-balance',
  BALANCE_SHEET = 'balance-sheet',
  INCOME_STATEMENT = 'income-statement',
}

export enum ExportFormat {
  EXCEL = 'excel',
  PDF = 'pdf',
}

export class ExportReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}
