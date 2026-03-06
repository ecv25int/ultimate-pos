import {
  IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean,
} from 'class-validator';

export class CreateNotificationTemplateDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  templateFor: string;

  @IsOptional() @IsString()
  emailBody?: string;

  @IsOptional() @IsString()
  smsBody?: string;

  @IsOptional() @IsString() @MaxLength(255)
  subject?: string;

  @IsOptional() @IsBoolean()
  autoSend?: boolean;
}
