import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { OrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  // @Type(() => Number)
  // @IsNumber()
  // @IsPositive()
  // public totalAmount: number;

  // @Type(() => Number)
  // @IsNumber()
  // public totalItems: number;

  // @IsEnum(OrderStatusList, {
  //   message: `Possible status values are ${OrderStatusList}`,
  // })
  // @IsOptional()
  // public status: OrderStatus = OrderStatus.PENDING;

  // @Type(() => Boolean)
  // @IsBoolean()
  // @IsOptional()
  // public paid?: boolean = false;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
