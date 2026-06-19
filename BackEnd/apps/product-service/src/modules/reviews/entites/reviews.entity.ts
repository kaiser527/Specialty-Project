import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int', { nullable: true })
  rating: number | null;

  @Column('text')
  comment: string;

  @Column()
  userId: string;

  @Column()
  variantId: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ProductVariant, (v) => v.reviews)
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @ManyToOne(() => Review, (review) => review.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Review;

  @Column({ nullable: true })
  parentId: string | null;

  @OneToMany(() => Review, (review) => review.parent)
  children: Review[];

  @Column({ type: 'int', default: 0 })
  depth: number;
}
