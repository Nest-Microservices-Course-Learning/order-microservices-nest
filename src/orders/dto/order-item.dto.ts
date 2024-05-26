import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class OrderItemDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  productId: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;
}
