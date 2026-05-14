import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('stock_in')
export class StockIn {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'inbound_no' })
  orderNo!: string;

  @Column({ name: 'material_id' })
  materialId!: number;

  @Column({ name: 'quantity' })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId?: number;

  @Column({ name: 'operator_id', nullable: true })
  operatorId?: number;

  @Column({ name: 'remark', nullable: true })
  remark?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
