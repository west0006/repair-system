// chat/message.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('message')
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'order_id', nullable: true })
  orderId?: number;

  @Column({ name: 'sender_id' })
  senderId!: number;

  @Column({ name: 'receiver_id' })
  receiverId!: number;

  @Column({ name: 'sender_type' })
  senderType!: number; // 0-用户 1-师傅 2-管理员

  @Column()
  content!: string;

  @Column({ default: 0 })
  type!: number; // 0-文本 1-图片

  @Column({ name: 'is_read', default: 0 })
  isRead!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
