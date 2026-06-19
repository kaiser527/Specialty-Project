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
import { Order } from './orders.entity';
import { ProviderFee } from '../../providers/entities/provider-fees.entity';
import { ProviderOrder } from '../../providers/entities/provider-order.entity';

@Entity('orderItems')
@Unique(['orderId', 'variantId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  variantId: string;

  @Column()
  orderId: string;

  @Column()
  quantity: number;

  @Column()
  unitPrice: number;

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

  @ManyToOne((type) => Order, (order) => order.items)
  @JoinColumn()
  order: Order;

  @OneToOne((type) => ProviderFee, (fee) => fee.orderItem)
  fee: ProviderFee;

  @OneToOne((type) => ProviderOrder, (po) => po.orderItem)
  providerOrder: ProviderOrder;
}
