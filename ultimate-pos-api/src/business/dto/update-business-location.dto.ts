import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessLocationDto } from './create-business-location.dto';

export class UpdateBusinessLocationDto extends PartialType(CreateBusinessLocationDto) {}
