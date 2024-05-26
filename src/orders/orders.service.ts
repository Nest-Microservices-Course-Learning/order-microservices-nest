import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeStatusOrderDto, OrderPaginationDto } from './dto';
import { PRODUCT_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrderService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ) {
    super();
  }

  async validateProductsMs(payload, data) {
    try {
      const products = await firstValueFrom(
        this.productsClient.send(payload, data),
      );
      return products;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Error in servce Product ms',
      });
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productsIds = createOrderDto.items.map((item) => item.productId);

      const products = await this.validateProductsMs(
        { cmd: 'validate_products' },
        productsIds,
      );

      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;
        return acc + price * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId,
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((item) => ({
          ...item,
          name: products.find((product) => product.id === item.productId).name,
        })),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check Logs',
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { status, page, limit } = orderPaginationDto;
    const totalPage = await this.order.count({
      where: {
        status: status,
      },
    });
    const lastPage = Math.ceil(totalPage / limit);

    return {
      total: totalPage,
      currentPage: page,
      lastPage: lastPage,
      data: await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          status: status,
        },
      }),
      nextPage:
        page + 1 < lastPage ? `/products?page=${page + 1}&limit=${limit}` : '',
      backPage: page - 1 > 0 ? `/products?page=${page - 1}&limit=${limit}` : '',
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: {
        id: id,
      },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    const productsIds = order.OrderItem.map((item) => item.productId);
    const products = await this.validateProductsMs(
      { cmd: 'validate_products' },
      productsIds,
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((item) => ({
        ...item,
        name: products.find((product) => product.id === item.productId).name,
      })),
    };
  }

  async changeStatus(changeStatusOrderDto: ChangeStatusOrderDto) {
    const { id, status } = changeStatusOrderDto;

    const order = await this.findOne(id);
    if (order.status === status) return order;

    return this.order.update({
      where: {
        id: id,
      },
      data: {
        status: status,
      },
    });
  }
}
