import { IsString, IsNotEmpty, MaxLength, IsInt } from 'class-validator';

export class CreateVariationValueTemplateDto {
  @IsInt()
  variationTemplateId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
