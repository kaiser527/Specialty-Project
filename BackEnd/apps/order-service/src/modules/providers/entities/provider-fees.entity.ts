import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from '../../orders/entities/order-items.entity';
import { Order } from '../../orders/entities/orders.entity';
import { ProviderFeeStatus } from 'libs/utils/constants';

@Entity('providers-fee')
@Unique(['orderItemId'])
export class ProviderFee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  orderItemId: string;

  @Column()
  ownerId: string;

  @Column('decimal', { precision: 5, scale: 2 })
  percent: number;

  @Column('decimal', { precision: 12, scale: 2 })
  feeAmount: number;

  @Column({
    type: 'enum',
    enum: ProviderFeeStatus,
    default: ProviderFeeStatus.PENDING,
  })
  status: ProviderFeeStatus;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ nullable: true })
  deletedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToOne((type) => OrderItem, (orderItem) => orderItem.fee)
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  @ManyToOne((type) => Order, (order) => order.fees)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
