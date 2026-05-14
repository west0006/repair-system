import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum MaterialApplicationStatus {
  PENDING_PAYMENT = 1, // 待支付（师生端专用）
  PAID = 2, // 已支付
  FREE = 3, // 无需支付（师傅端或金额为0）
  CANCELLED = 4, // 已取消（超时或手动取消）
  REJECTED = 5, // 已驳回（审核不通过）
}

@Entity('material_application')
export class MaterialApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'applicant_id' })
  applicantId: number;

  @Column({ type: 'json' })
  items: {
    materialId: number;
    quantity: number;
    unitPrice?: number;
    discount?: number;
  }[];

  @Column({ nullable: true })
  reason?: string;

  @Column({ default: MaterialApplicationStatus.PENDING_PAYMENT })
  status: MaterialApplicationStatus;

  @Column({ nullable: true, name: 'approver_id' })
  approverId?: number;

  @Column({ nullable: true, name: 'reject_reason' })
  rejectReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'service_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  serviceFee: number;

  @Column({
    name: 'total_discount',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1.0,
  })
  totalDiscount: number;

  @Column({
    name: 'pay_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  payAmount?: number;

  @Column({ name: 'lock_expires_at', type: 'datetime', nullable: true })
  lockExpiresAt?: Date;

  @Column({ name: 'payment_status', default: 0 })
  paymentStatus: number; // 0-未支付 1-已支付 2-超时
}
