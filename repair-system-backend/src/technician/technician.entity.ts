import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { TechnicianBuilding } from './technician-building.entity';
import { RepairOrder } from '../order/order.entity'; // 新增导入

@Entity('technician')
export class Technician {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'area_id', nullable: true })
  areaId?: number;

  @Column({ name: 'skills', nullable: true })
  skills?: string;

  @Column({ name: 'status', default: 1 })
  status!: number; // 1-空闲 2-忙碌 3-休假

  @OneToMany(() => TechnicianBuilding, (tb) => tb.technician)
  buildingMappings: TechnicianBuilding[];

  // 新增反向关联
  @OneToMany(() => RepairOrder, (order) => order.technician)
  orders: RepairOrder[];
}
