import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('repair_position')
export class RepairPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ name: 'name_ko', nullable: true })
  nameKo: string;

  @Column({ name: 'visible_to_user', default: true })
  visibleToUser: boolean;

  @Column({ name: 'dispatch_type', default: 'direct' })
  dispatchType: string; // 'direct' | 'area' | 'round_robin'

  @Column({ name: 'allow_transfer', default: true })
  allowTransfer: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
