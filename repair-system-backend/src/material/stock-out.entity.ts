import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('stock_out')
export class StockOut {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'outbound_no' })
  orderNo!: string;

  @Column({ name: 'material_id' })
  materialId!: number;

  @Column({ name: 'quantity' })
  quantity!: number;

  @Column({ name: 'repair_order_id', nullable: true })
  repairOrderId?: number;

  @Column({ name: 'reason', nullable: true })
  reason?: string;

  @Column({ name: 'applicant_id', nullable: true })
  applicantId?: number;

  @Column({ name: 'approver_id', nullable: true })
  approverId?: number;

  @Column({ name: 'status', default: 1 })
  status!: number; // 1-待审批 2-已通过 3-已驳回

  @Column({ name: 'reject_reason', nullable: true })
  rejectReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'outbound_type', default: 'order' })
  outboundType!: string; // 新增：order-工单消耗, loss-损耗, transfer-调拨
}
