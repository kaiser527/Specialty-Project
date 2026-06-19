import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/orders.entity';
import { VoucherUsage } from './voucher-usages.entities';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column('decimal', { precision: 10, scale: 2 })
  discountAmount: number;

  @Column()
  expirationDate: Date;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany((type) => Order, (order) => order.voucher)
  orders: Order[];

  @OneToMany(() => VoucherUsage, (usage) => usage.voucher)
  usages: VoucherUsage[];
}
