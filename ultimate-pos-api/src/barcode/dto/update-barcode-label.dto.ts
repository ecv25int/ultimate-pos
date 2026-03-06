import { PartialType } from '@nestjs/mapped-types';
import { CreateBarcodeLabelDto } from './create-barcode-label.dto';

export class UpdateBarcodeLabelDto extends PartialType(CreateBarcodeLabelDto) {}
