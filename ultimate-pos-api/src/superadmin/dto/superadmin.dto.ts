import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsIn, IsDateString } from 'class-validator';

export class CreatePackageDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsInt() locationCount: number;
  @IsInt() userCount: number;
  @IsInt() productCount: number;
  @IsInt() invoiceCount: number;
  @IsString() @IsIn(['days','months','years']) interval: string;
  @IsInt() intervalCount: number;
  @IsInt() trialDays: number;
  @IsNumber() price: number;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsBoolean() isActive: boolean;
}

export class UpdatePackageDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class CreateSubscriptionDto {
  @IsInt() businessId: number;
  @IsInt() packageId: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() trialEndDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsNumber() packagePrice: number;
  @IsString() packageDetails: string;
  @IsOptional() @IsString() paidVia?: string;
  @IsOptional() @IsString() paymentTransactionId?: string;
}

export class UpdateSubscriptionStatusDto {
  @IsString() @IsIn(['approved','waiting','declined']) status: string;
}
