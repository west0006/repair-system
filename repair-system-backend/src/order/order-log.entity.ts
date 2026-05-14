import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('order_log')
export class OrderLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'order_id' })
  orderId!: number;

  @Column({ nullable: true, name: 'from_status' })
  fromStatus?: number;

  @Column({ nullable: true, name: 'to_status' })
  toStatus?: number;

  @Column({ nullable: true, name: 'operator_id' })
  operatorId?: number;

  @Column({ nullable: true })
  remark?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
