import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateResTableDto {
  @IsString()
  name: string;

  @IsInt()
  @Type(() => Number)
  locationId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;
}

export class UpdateResTableDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  locationId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateBookingDto {
  @IsInt()
  @Type(() => Number)
  contactId: number;

  @IsInt()
  @Type(() => Number)
  locationId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tableId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  waiterId?: number;

  @IsString()
  bookingStart: string;

  @IsString()
  bookingEnd: string;

  @IsOptional()
  @IsString()
  bookingNote?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  guestCount?: number;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tableId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  waiterId?: number;

  @IsOptional()
  @IsString()
  bookingStart?: string;

  @IsOptional()
  @IsString()
  bookingEnd?: string;

  @IsOptional()
  @IsString()
  bookingStatus?: string;

  @IsOptional()
  @IsString()
  bookingNote?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  guestCount?: number;
}
