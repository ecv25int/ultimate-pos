import {
  IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, IsEnum,
} from 'class-validator';

export enum DurationType {
  days = 'days',
  months = 'months',
  years = 'years',
}

export class CreateWarrantyDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsInt()
  duration: number;

  @IsEnum(DurationType)
  durationType: DurationType;
}
