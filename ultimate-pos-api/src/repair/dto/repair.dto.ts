import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

// ─── Status ───────────────────────────────────────────────────────────────────

export class CreateRepairStatusDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

// ─── Device Model ─────────────────────────────────────────────────────────────

export class CreateDeviceModelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  repairChecklist?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  brandId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  deviceId?: number;
}

// ─── Job Sheet ────────────────────────────────────────────────────────────────

export class CreateJobSheetDto {
  @IsInt()
  @Type(() => Number)
  contactId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  locationId?: number;

  @IsString()
  jobSheetNo: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  pickUpOnSiteAddr?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  brandId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  deviceId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  deviceModelId?: number;

  @IsOptional()
  @IsString()
  checklist?: string;

  @IsOptional()
  @IsString()
  securityPwd?: string;

  @IsOptional()
  @IsString()
  securityPattern?: string;

  @IsString()
  serialNo: string;

  @IsInt()
  @Type(() => Number)
  statusId: number;

  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  defects?: string;

  @IsOptional()
  @IsString()
  productCondition?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  serviceStaff?: number;

  @IsOptional()
  @IsString()
  commentBySs?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  parts?: string;
}

export class UpdateJobSheetDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  statusId?: number;

  @IsOptional()
  @IsString()
  commentBySs?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  serviceStaff?: number;

  @IsOptional()
  @IsString()
  parts?: string;
}
