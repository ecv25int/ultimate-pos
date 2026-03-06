import { IsString, IsOptional } from 'class-validator';

export class ImportDataDto {
  @IsString()
  entity: string; // 'products' | 'contacts' | 'purchases' etc.

  @IsOptional()
  @IsString()
  delimiter?: string;
}
