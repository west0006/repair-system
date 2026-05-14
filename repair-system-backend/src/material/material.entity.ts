import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('material')
export class Material {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'category_id' })
  categoryId!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  spec?: string;

  @Column({ nullable: true })
  unit?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({
    name: 'standard_discount',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1.0,
  })
  standardDiscount!: number;

  @Column({ nullable: true, name: 'supplier_id' })
  supplierId?: number;

  @Column({ default: 0 })
  stock!: number;

  @Column({ name: 'locked_stock', default: 0 })
  lockedStock!: number;

  @Column({ default: 0, name: 'min_stock' })
  minStock!: number;

  @Column({ default: 0, name: 'max_stock' })
  maxStock!: number;

  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate?: Date;
  @Column({ name: 'expiry_warning_days' })
  expiryWarningDays?: number;
  @Column({ default: 1 })
  status!: number; // 1-正常 2-停用
}
