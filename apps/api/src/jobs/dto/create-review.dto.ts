import { IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

/** A 1–5 star rating left after a job completes (business↔driver). */
export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
