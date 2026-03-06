import { IsString, IsOptional, IsBoolean, IsInt, IsNumber, MinLength, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUnitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  actualName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  shortName: string;

  @IsOptional()
  @IsBoolean()
  allowDecimal?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  baseUnitId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.0001)
  baseUnitMultiplier?: number;
}
