import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEmail,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateScheduledReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  reportType: string; // 'sales_summary' | 'profit_loss' | 'inventory' | 'expenses' | 'contacts'

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  frequency: string; // 'daily' | 'weekly' | 'monthly'

  @IsArray()
  @IsString({ each: true })
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
