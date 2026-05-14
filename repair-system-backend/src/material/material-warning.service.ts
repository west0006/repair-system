// material/material-warning.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Material } from './material.entity';
import { NotificationService } from '../common/notification.service';
import { User } from '../auth/user.entity';
import { Role } from '../auth/roles.enum';

@Injectable()
export class MaterialWarningService {
  private readonly logger = new Logger(MaterialWarningService.name);

  constructor(
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  @Cron('0 0 8 * * *')
  async checkWarnings() {
    this.logger.log('开始检查库存预警');
    const admins = await this.userRepo.find({ where: { role: Role.Admin } });
    if (admins.length === 0) return;

    // 低库存
    const lowStock = await this.materialRepo
      .createQueryBuilder('m')
      .where('m.stock < m.minStock')
      .getMany();
    for (const m of lowStock) {
      for (const admin of admins) {
        await this.notificationService.create({
          userId: admin.id,
          title: '库存不足预警',
          content: `物料【${m.name}】当前库存 ${m.stock}，低于最低库存阈值 ${m.minStock}`,
          link: '/material/list',
        });
      }
    }

    // 高库存
    const highStock = await this.materialRepo
      .createQueryBuilder('m')
      .where('m.stock > m.maxStock')
      .getMany();
    for (const m of highStock) {
      for (const admin of admins) {
        await this.notificationService.create({
          userId: admin.id,
          title: '库存积压预警',
          content: `物料【${m.name}】当前库存 ${m.stock}，高于最高库存阈值 ${m.maxStock}`,
          link: '/material/list',
        });
      }
    }

    // 临期提醒（7天内到期）
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const expiring = await this.materialRepo.find({
      where: { expiryDate: LessThan(sevenDaysLater) },
    });
    for (const m of expiring) {
      const expiryDateStr = m.expiryDate!.toLocaleDateString('zh-CN');
      for (const admin of admins) {
        await this.notificationService.create({
          userId: admin.id,
          title: '物料临期提醒',
          content: `物料【${m.name}】将于 ${expiryDateStr} 过期，请及时处理`,
          link: '/material/list',
        });
      }
    }
  }
}
