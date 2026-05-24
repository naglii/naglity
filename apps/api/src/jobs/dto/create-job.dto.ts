import { IsString, IsInt, IsDateString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  grossPriceCents: number;

  @IsDateString()
  scheduledAt: string;

  @IsDateString()
  estimatedEndAt: string;

  @IsString()
  fromLocation: string;

  @IsNumber()
  @IsOptional()
  fromLat?: number;

  @IsNumber()
  @IsOptional()
  fromLng?: number;

  @IsString()
  toLocation: string;

  @IsNumber()
  @IsOptional()
  toLat?: number;

  @IsNumber()
  @IsOptional()
  toLng?: number;
}
