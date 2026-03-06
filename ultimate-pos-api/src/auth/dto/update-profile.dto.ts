import { IsEmail, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @IsIn(['en', 'ar', 'fr', 'es', 'de', 'pt', 'hi', 'zh'])
  locale?: string;
}
