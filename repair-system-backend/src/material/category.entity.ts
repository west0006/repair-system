// material/category.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true, name: 'parent_id' })
  parentId?: number;

  @Column({ default: 1 })
  status!: number;
}
