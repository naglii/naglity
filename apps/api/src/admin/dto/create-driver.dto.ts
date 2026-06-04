import { IsString, MinLength, IsOptional, IsEmail, IsInt, Min } from 'class-validator';

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

  @IsInt()
  @Min(1)
  @IsOptional()
  craneCapacityTons?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  liftHeightMeters?: number;
}
