import { IsString, IsNotEmpty, MinLength, IsBoolean, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
