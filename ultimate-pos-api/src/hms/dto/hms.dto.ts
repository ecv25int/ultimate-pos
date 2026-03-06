import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsDateString } from 'class-validator';

export class CreateRoomTypeDto {
  @IsString() type: string;
  @IsInt() noOfAdult: number;
  @IsInt() noOfChild: number;
  @IsInt() maxOccupancy: number;
  @IsOptional() @IsString() amenities?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateRoomDto {
  @IsInt() hmsRoomTypeId: number;
  @IsString() roomNumber: string;
}

export class CreateExtraDto {
  @IsString() name: string;
  @IsNumber() price: number;
  @IsString() pricePer: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateBookingLineDto {
  @IsInt() transactionId: number;
  @IsInt() hmsRoomId: number;
  @IsInt() hmsRoomTypeId: number;
  @IsInt() adults: number;
  @IsInt() childrens: number;
  @IsNumber() price: number;
  @IsNumber() totalPrice: number;
}
