import { IsInt, Min, IsString, IsOptional } from 'class-validator';

/** A driver's quote on an "open to offers" job. */
export class CreateOfferDto {
  @IsInt()
  @Min(1)
  amountCents: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  etaMinutes?: number;
}
