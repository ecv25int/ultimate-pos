import { IsString, IsOptional, IsInt, IsDateString, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsString() name: string;
  @IsOptional() @IsInt() contactId?: number;
  @IsOptional() @IsString() @IsIn(['not_started','in_progress','on_hold','cancelled','completed']) status?: string;
  @IsOptional() @IsInt() leadId?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsInt({ each: true }) memberUserIds?: number[];
}

export class UpdateProjectDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() @IsIn(['not_started','in_progress','on_hold','cancelled','completed']) status?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateTaskDto {
  @IsInt() projectId: number;
  @IsString() subject: string;
  @IsOptional() @IsString() @IsIn(['low','medium','high','urgent']) priority?: string;
  @IsOptional() @IsString() @IsIn(['not_started','in_progress','on_hold','cancelled','completed']) status?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateTaskDto {
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() @IsIn(['low','medium','high','urgent']) priority?: string;
  @IsOptional() @IsString() @IsIn(['not_started','in_progress','on_hold','cancelled','completed']) status?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}

export class CreateTimeLogDto {
  @IsInt() projectId: number;
  @IsOptional() @IsInt() taskId?: number;
  @IsDateString() startTime: string;
  @IsOptional() @IsDateString() endTime?: string;
  @IsOptional() @IsString() note?: string;
}

export class CreateCommentDto {
  @IsInt() taskId: number;
  @IsString() comment: string;
}
