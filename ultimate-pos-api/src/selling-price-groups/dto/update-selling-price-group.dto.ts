import { PartialType } from '@nestjs/mapped-types';
import { CreateSellingPriceGroupDto } from './create-selling-price-group.dto';

export class UpdateSellingPriceGroupDto extends PartialType(CreateSellingPriceGroupDto) {}
