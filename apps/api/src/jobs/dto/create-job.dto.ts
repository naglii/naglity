import { IsString, IsInt, IsDateString, IsOptional, Min } from 'class-validator';

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

  @IsString()
  toLocation: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  craneCapacityTons?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  liftHeightMeters?: number;

  @IsString()
  @IsOptional()
  loadType?: string;

  @IsString()
  @IsOptional()
  accessNotes?: string;
}
