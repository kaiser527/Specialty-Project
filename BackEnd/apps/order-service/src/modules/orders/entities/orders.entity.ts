import { OrderStatus } from 'libs/utils/constants';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-items.entity';
import { ProviderFee } from '../../providers/entities/provider-fees.entity';
import { ProviderOrder } from '../../providers/entities/provider-order.entity';
import { Voucher } from '../../vouchers/entities/vouchers.entities';
import { VoucherUsage } from '../../vouchers/entities/voucher-usages.entities';

@Index(['userId', 'createdAt'])
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column()
  phone: string;

  @Column({ nullable: true })
  voucherId?: string;

  @Column({ nullable: true })
  voucherCode?: string;

  @Column({ default: 0 })
  discountAmount: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  type: string;

  @Column()
  paymentRef: string;

  @Column()
  shippingFee: number;

  @Column()
  subTotal: number;

  @Column()
  totalPrice: number;

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

  @OneToMany((type) => OrderItem, (od) => od.order)
  items: OrderItem[];

  @OneToMany((type) => ProviderFee, (fee) => fee.order)
  fees: ProviderFee[];

  @OneToMany((type) => ProviderOrder, (co) => co.order)
  providerOrders: ProviderOrder[];

  @ManyToOne(() => Voucher, (voucher) => voucher.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'voucherId' })
  voucher: Voucher;

  @OneToMany(() => VoucherUsage, (usage) => usage.order)
  usages: VoucherUsage[];
}
