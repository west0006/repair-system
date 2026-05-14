// common/notification.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column()
  title!: string;

  @Column()
  content!: string;

  @Column({ default: 0, name: 'is_read' })
  isRead!: boolean;

  @Column({ nullable: true })
  link?: string; // 跳转链接（如工单详情）

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
