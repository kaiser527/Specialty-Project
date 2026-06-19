import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Order } from '../orders/entities/orders.entity';
import { OrderItem } from '../orders/entities/order-items.entity';
import { DatabaseService } from './database.service';
import { ProviderFee } from '../providers/entities/provider-fees.entity';
import { ProviderOrder } from '../providers/entities/provider-order.entity';
import { Voucher } from '../vouchers/entities/vouchers.entities';
import { VoucherUsage } from '../vouchers/entities/voucher-usages.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      ProviderFee,
      ProviderOrder,
      Voucher,
      VoucherUsage,
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: +configService.get<string>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [],
        synchronize: true,
        autoLoadEntities: true,
      }),
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
