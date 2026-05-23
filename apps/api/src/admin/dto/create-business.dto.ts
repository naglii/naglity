import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class CreateBusinessDto {
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
}
