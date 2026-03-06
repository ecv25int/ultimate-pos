import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateVariationTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
