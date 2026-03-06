import { IsArray, IsInt } from 'class-validator';

export class SetGroupSubTaxesDto {
  /** Array of TaxRate IDs to set as sub-taxes for this group tax */
  @IsArray()
  @IsInt({ each: true })
  taxIds: number[];
}
