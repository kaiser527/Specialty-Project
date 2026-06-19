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
import { Order } from '../../orders/entities/orders.entity';
import { OrderItem } from '../../orders/entities/order-items.entity';
import { ProviderOrderStatus } from 'libs/utils/constants';

@Entity('providers-order')
@Unique(['orderItemId'])
export class ProviderOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderItemId: string;

  @Column()
  orderId: string;

  @Column()
  ownerId: string;

  @Column({
    type: 'enum',
    enum: ProviderOrderStatus,
    default: ProviderOrderStatus.PENDING,
  })
  status: ProviderOrderStatus;

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

  @ManyToOne((type) => Order, (order) => order.providerOrders)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @OneToOne((type) => OrderItem, (od) => od.providerOrder)
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;
}
