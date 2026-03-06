import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateSyncLogDto {
  @IsString() syncType: string;
  @IsOptional() @IsString() @IsIn(['created','updated']) operationType?: string;
  @IsOptional() @IsString() data?: string;
  @IsOptional() @IsString() details?: string;
}
