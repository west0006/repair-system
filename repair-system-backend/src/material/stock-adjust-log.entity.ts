// material/stock-adjust-log.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('stock_adjust_log')
export class StockAdjustLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  materialId: number;

  @Column()
  beforeStock: number;

  @Column()
  afterStock: number;

  @Column()
  diff: number;

  @Column({ nullable: true })
  reason: string;

  @Column()
  operatorId: number;

  @CreateDateColumn()
  createdAt: Date;
}
