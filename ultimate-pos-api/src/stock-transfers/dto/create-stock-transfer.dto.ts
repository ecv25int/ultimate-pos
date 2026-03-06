import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const TRANSFER_STATUSES = ['pending', 'completed', 'cancelled'] as const;
export type TransferStatus = typeof TRANSFER_STATUSES[number];

export class CreateStockTransferDto {
  @IsInt()
  productId: number;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsString()
  fromLocation: string;

  @IsString()
  toLocation: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(TRANSFER_STATUSES)
  status?: TransferStatus;
}
