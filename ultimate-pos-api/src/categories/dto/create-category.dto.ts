import { IsString, IsOptional, IsInt, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shortCode?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentId?: number;
}
