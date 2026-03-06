import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessDto } from './create-business.dto';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /** COM port (e.g. /dev/ttyUSB0) or TCP host/IP for network cash drawer */
  @IsString()
  @IsOptional()
  cashDrawerHost?: string;

  /** TCP port for network cash drawer (e.g. 9100); omit for serial mode */
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  cashDrawerPort?: number;
}
