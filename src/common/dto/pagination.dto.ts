import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsPositive()
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @Type(() => Number)
  @IsPositive()
  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}
