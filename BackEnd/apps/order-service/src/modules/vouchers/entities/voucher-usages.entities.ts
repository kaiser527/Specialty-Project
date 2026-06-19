import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Voucher } from './vouchers.entities';
import { Order } from '../../orders/entities/orders.entity';

@Entity('voucher_usages')
@Unique(['voucherId', 'userId'])
export class VoucherUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  voucherId: string;

  @Column()
  userId: string;

  @Column()
  orderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Voucher, (voucher) => voucher.usages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'voucherId' })
  voucher: Voucher;

  @ManyToOne(() => Order, (order) => order.usages)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
