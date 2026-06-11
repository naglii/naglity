import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class EstimatePriceDto {
  @IsString()
  fromLocation: string;

  @IsString()
  toLocation: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  craneCapacityTons?: number;
}
