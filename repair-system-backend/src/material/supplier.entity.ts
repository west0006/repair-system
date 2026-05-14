// material/supplier.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('supplier')
export class Supplier {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true, name: 'contact_person' })
  contactPerson?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ default: 1 })
  status!: number; // 1-合作中 2-暂停合作

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
