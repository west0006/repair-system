// material/stock-check.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('stock_check')
export class StockCheck {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'check_no' })
  checkNo!: string; // 盘点单号

  @Column({ type: 'json' })
  items!: { materialId: number; actualQuantity: number; note?: string }[]; // 盘点明细

  @Column({ default: 0 })
  status!: number; // 0-草稿 1-待审核 2-已确认 3-已驳回

  @Column({ name: 'operator_id' })
  operatorId!: number;

  @Column({ nullable: true, name: 'approver_id' })
  approverId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ nullable: true, name: 'reject_reason' })
  rejectReason?: string;
}
