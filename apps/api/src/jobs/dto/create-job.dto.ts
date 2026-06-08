import { IsString, IsInt, IsDateString, IsOptional, Min, IsIn } from 'class-validator';

export class CreateJobDto {
  @IsString()
  title: string;

  // FIXED = poster sets the price (first-accept). OFFERS = drivers quote, poster picks.
  @IsIn(['FIXED', 'OFFERS'])
  @IsOptional()
  pricingMode?: 'FIXED' | 'OFFERS';

  @IsString()
  @IsOptional()
  description?: string;

  // 0 is allowed for OFFERS jobs (price is set when the poster picks an offer).
  @IsInt()
  @Min(0)
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
