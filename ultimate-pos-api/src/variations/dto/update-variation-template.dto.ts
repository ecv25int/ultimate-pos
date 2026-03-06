import { PartialType } from '@nestjs/mapped-types';
import { CreateVariationTemplateDto } from './create-variation-template.dto';

export class UpdateVariationTemplateDto extends PartialType(CreateVariationTemplateDto) {}
