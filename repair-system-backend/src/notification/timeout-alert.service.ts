import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, IsNull } from 'typeorm';
import { RepairOrder } from '../order/order.entity';
import { OrderStatus } from '../order/order-status.enum';
import { NotificationService } from '../common/notification.service';
import { User } from '../auth/user.entity';
import { Role } from '../auth/roles.enum';

@Injectable()
export class TimeoutAlertService {
  private readonly logger = new Logger(TimeoutAlertService.name);
  constructor(
    @InjectRepository(RepairOrder) private orderRepo: Repository<RepairOrder>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  @Cron('*/10 * * * *')
  async checkResponseTimeout() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // 紧急工单15分钟未接单
    const urgentTimeout = await this.orderRepo.find({
      where: {
        urgency: 3,
        status: OrderStatus.DISPATCHED,
        // 派单后15分钟内未接单（acceptTime 为空）
        acceptTime: IsNull(),
        createdAt: LessThan(fifteenMinutesAgo), // 派单时间用 createdAt 代替（需确保 createdAt 即派单时间）
      },
    });

    // 普通工单1小时未接单
    const normalTimeout = await this.orderRepo.find({
      where: {
        urgency: In([1, 2]),
        status: OrderStatus.DISPATCHED,
        acceptTime: IsNull(),
        createdAt: LessThan(oneHourAgo),
      },
    });

    const timeoutOrders = [...urgentTimeout, ...normalTimeout];
    if (timeoutOrders.length === 0) return;

    const admins = await this.userRepo.find({ where: { role: Role.Admin } });
    for (const order of timeoutOrders) {
      for (const admin of admins) {
        await this.notificationService.create({
          userId: admin.id,
          title: '工单响应超时',
          content: `工单 ${order.orderNo} 已派单超过${order.urgency === 3 ? '15分钟' : '1小时'}，师傅未接单，请处理`,
          link: `/order/detail/${order.id}`,
        });
      }
    }
    this.logger.log(`发现 ${timeoutOrders.length} 个超时工单，已通知管理员`);
  }
}
