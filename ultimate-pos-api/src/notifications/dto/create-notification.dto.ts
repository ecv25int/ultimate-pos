import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationType {
  LOW_STOCK  = 'low_stock',
  SALE       = 'sale',
  PURCHASE   = 'purchase',
  INFO       = 'info',
  WARNING    = 'warning',
  ERROR      = 'error',
}

export class CreateNotificationDto {
  @IsInt()
  @Type(() => Number)
  userId: number;

  @IsEnum(NotificationType)
  type: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  link?: string;
}
