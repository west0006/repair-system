import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('building')
export class Building {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ unique: true })
  name: string;
  @Column({ nullable: true, name: 'name_en' })
  nameEn?: string;
  @Column({ nullable: true, name: 'area_id' })
  areaId?: number;
  @Column({ default: 0, name: 'sort_order' })
  sortOrder: number;
  @Column({ default: 1 })
  status: number;
}
