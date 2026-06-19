import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Cart } from './cart.entity';

@Entity('cartItems')
@Unique(['cartId', 'variantId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  variantId: string;

  @Column()
  cartId: string;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Cart, (cart) => cart.items)
  cart: Cart;
}
