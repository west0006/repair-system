import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
  MaterialApplication,
  MaterialApplicationStatus,
} from '../material/material-application.entity';
import { Material } from '../material/material.entity';
import { RepairOrder } from '../order/order.entity';
import { OrderStatus } from '../order/order-status.enum';

@Injectable()
export class TimeoutReleaseStockService {
  private readonly logger = new Logger(TimeoutReleaseStockService.name);

  constructor(
    @InjectRepository(MaterialApplication)
    private materialAppRepo: Repository<MaterialApplication>,
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    @InjectRepository(RepairOrder)
    private orderRepo: Repository<RepairOrder>,
  ) {}

  @Cron('*/1 * * * *')
  async releaseExpiredLocks() {
    const expiredApps = await this.materialAppRepo.find({
      where: {
        status: MaterialApplicationStatus.PENDING_PAYMENT,
        paymentStatus: 0,
        lockExpiresAt: LessThan(new Date()),
      },
    });

    for (const app of expiredApps) {
      this.logger.log(`申领单 ${app.id} 超时，释放锁定库存`);
      for (const item of app.items) {
        const material = await this.materialRepo.findOne({
          where: { id: item.materialId },
        });
        if (material) {
          material.lockedStock = Math.max(
            0,
            material.lockedStock - item.quantity,
          );
          await this.materialRepo.save(material);
        }
      }
      app.paymentStatus = 2;
      app.status = MaterialApplicationStatus.CANCELLED;
      await this.materialAppRepo.save(app);

      // 工单状态回退，允许师傅重新申领
      await this.orderRepo.update(app.orderId, {
        material_bill_status: 0,
        status: OrderStatus.REPAIRING,
      });
    }
  }
}
