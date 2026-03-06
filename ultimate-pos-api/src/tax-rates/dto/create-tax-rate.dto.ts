import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateTaxRateDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @IsOptional()
  @IsEnum(['percentage', 'fixed'])
  type?: 'percentage' | 'fixed';

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
