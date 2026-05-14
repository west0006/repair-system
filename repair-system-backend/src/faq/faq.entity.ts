import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('faq')
export class Faq {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  @Index()
  keyword: string; // 关键词，如“灯不亮”、“跳闸”

  @Column('text')
  solution: string; // 解决方案（支持 HTML 或纯文本）

  @Column({ default: 0, name: 'sort_order' })
  sortOrder: number; // 排序权重，数值越小越优先匹配

  @Column({ default: 1, name: 'status' })
  status: number; // 1-启用 2-禁用

  @Column({ type: 'text', nullable: true })
  remark?: string; // 备注
}
