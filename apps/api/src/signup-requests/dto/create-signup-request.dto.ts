import { IsString, IsOptional, IsEmail, IsIn, MinLength } from 'class-validator';

export class CreateSignupRequestDto {
  @IsIn(['DRIVER', 'BUSINESS'])
  type: 'DRIVER' | 'BUSINESS';

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @MinLength(5)
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  details?: string;
}
