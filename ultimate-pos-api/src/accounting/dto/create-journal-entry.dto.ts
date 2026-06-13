import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsInt,
  IsEnum,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum JournalLineType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export class CreateJournalEntryLineDto {
  @IsInt()
  @Type(() => Number)
  accountId: number;

  @IsEnum(JournalLineType)
  type: JournalLineType;

  @IsNumber()
  @IsPositive()
  amount: number;
}

export class CreateJournalEntryDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJournalEntryLineDto)
  lines: CreateJournalEntryLineDto[];
}
