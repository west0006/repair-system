import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Technician } from './technician.entity';
import { Building } from '../building/building.entity';

@Entity('technician_building')
export class TechnicianBuilding {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'technician_id' })
  technicianId: number;

  @ManyToOne(() => Technician)
  @JoinColumn({ name: 'technician_id' })
  technician: Technician;

  @Column({ name: 'building_id' })
  buildingId: number;

  @ManyToOne(() => Building)
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
