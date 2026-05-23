import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  vehicleNumber: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;
}
