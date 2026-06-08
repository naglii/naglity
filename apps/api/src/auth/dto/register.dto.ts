import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

/** Self-serve customer signup (creates a job-poster account, accountType INDIVIDUAL). */
export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(5)
  phone: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  // SMS verification code (fake provider: 0000).
  @IsString()
  @MinLength(4)
  code: string;
}
