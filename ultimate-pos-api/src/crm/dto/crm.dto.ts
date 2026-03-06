import { IsString, IsOptional, IsInt, IsIn, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsIn(['email', 'sms'])
  campaignType: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  emailBody?: string;

  @IsOptional()
  @IsString()
  smsBody?: string;

  // JSON array string: "[1,2,3]" or array
  contactIds: string;
}

export class CreateScheduleDto {
  @IsInt()
  @Type(() => Number)
  contactId: number;

  @IsString()
  title: string;

  @IsIn(['call', 'sms', 'meeting', 'email'])
  scheduleType: string;

  @IsDateString()
  startDatetime: string;

  @IsDateString()
  endDatetime: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['call', 'sms', 'meeting', 'email'])
  scheduleType?: string;

  @IsOptional()
  @IsDateString()
  startDatetime?: string;

  @IsOptional()
  @IsDateString()
  endDatetime?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['pending', 'completed', 'cancelled'])
  status?: string;
}

export class CreateCallLogDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  contactId?: number;

  @IsIn(['inbound', 'outbound', 'missed'])
  callType: string;

  @IsString()
  mobileNumber: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  duration?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
