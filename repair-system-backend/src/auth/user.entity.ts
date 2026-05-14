import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column()
  phone!: string;

  @Column({ default: 0 })
  role!: number; // 0-普通用户 1-师傅 2-管理员

  @Column({ nullable: true })
  avatar?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ nullable: true })
  openid?: string;
}
