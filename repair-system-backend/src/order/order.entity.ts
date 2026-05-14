import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderStatus } from './order-status.enum';
import { Technician } from '../technician/technician.entity';

export enum MaterialBillStatus {
  NOT_CREATED = 0,
  PENDING_REVIEW = 1,
  AWAITING_PAYMENT = 2,
  PAID = 3,
  FREE = 4,
}

@Entity('repair_order')
export class RepairOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_no', length: 32, unique: true })
  orderNo: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'user_name', nullable: true })
  userName?: string;

  @Column({ name: 'user_phone', nullable: true })
  userPhone?: string;

  @Column({ name: 'location_building', nullable: true })
  locationBuilding?: string;

  @Column({ name: 'location_floor', nullable: true })
  locationFloor?: string;

  @Column({ name: 'location_room', nullable: true })
  locationRoom?: string;

  @Column({ name: 'fault_type', nullable: true })
  faultType?: string;

  @Column({ name: 'fault_desc', type: 'text', nullable: true })
  faultDesc?: string;

  @Column({ name: 'images', type: 'json', nullable: true })
  images?: string[];

  @Column({ name: 'videos', type: 'json', nullable: true })
  videos?: string[];

  @Column({ name: 'urgency', default: 1 })
  urgency: number;

  @Column({ name: 'status', default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'reject_reason', nullable: true })
  rejectReason?: string;

  @Column({ name: 'technician_id', nullable: true })
  technicianId?: number;

  @Column({ name: 'scheduled_time', type: 'datetime', nullable: true })
  scheduledTime?: Date;

  @Column({ name: 'start_time', type: 'datetime', nullable: true })
  startTime?: Date;

  @Column({ name: 'end_time', type: 'datetime', nullable: true })
  endTime?: Date;

  @Column({ name: 'accept_time', type: 'datetime', nullable: true })
  acceptTime?: Date;

  @Column({ name: 'pay_time', type: 'datetime', nullable: true })
  payTime?: Date;

  @Column({ type: 'json', nullable: true, comment: '工单关联备件账单明细' })
  material_bill: any;

  @Column({ type: 'tinyint', default: 0, comment: '账单支付状态' })
  material_bill_status: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  material_bill_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  material_bill_discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  material_bill_pay_amount: number;

  @Column({
    name: 'service_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  serviceFee: number;

  @Column({ name: 'evaluation_score', nullable: true })
  evaluationScore?: number;

  @Column({ name: 'evaluation_comment', length: 500, nullable: true })
  evaluationComment?: string;

  @Column({ name: 'repair_record', type: 'json', nullable: true })
  repairRecord?: any;

  @Column({ name: 'after_photos', type: 'json', nullable: true })
  afterPhotos?: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Technician, (technician) => technician.orders)
  @JoinColumn({ name: 'technician_id' })
  technician: Technician;
}
