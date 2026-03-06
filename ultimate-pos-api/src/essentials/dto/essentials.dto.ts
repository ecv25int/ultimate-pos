import { IsString, IsOptional, IsInt, IsDateString, IsIn, IsNumber } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString() leaveType: string;
  @IsOptional() @IsInt() maxLeaveCount?: number;
  @IsOptional() @IsString() @IsIn(['month','year']) leaveCountInterval?: string;
}

export class CreateLeaveDto {
  @IsOptional() @IsInt() essentialsLeaveTypeId?: number;
  @IsInt() userId: number;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() refNo?: string;
  @IsOptional() @IsString() reason?: string;
}

export class UpdateLeaveStatusDto {
  @IsString() @IsIn(['pending','approved','cancelled']) status: string;
  @IsOptional() @IsString() statusNote?: string;
}

export class CreatePayrollDto {
  @IsInt() userId: number;
  @IsOptional() @IsString() refNo?: string;
  @IsInt() month: number;
  @IsInt() year: number;
  @IsNumber() duration: number;
  @IsString() durationUnit: string;
  @IsNumber() amountPerUnitDuration: number;
  @IsOptional() @IsString() allowances?: string;
  @IsOptional() @IsString() deductions?: string;
  @IsNumber() grossAmount: number;
}

export class CreateDocumentDto {
  @IsInt() userId: number;
  @IsString() name: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateReminderDto {
  @IsString() name: string;
  @IsDateString() date: string;
  @IsString() time: string;
  @IsString() @IsIn(['one_time','every_day','every_week','every_month']) repeat: string;
}
