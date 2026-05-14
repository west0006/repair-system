// material/stock-check.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockCheck } from './stock-check.entity';
import { Material } from './material.entity';
import { StockAdjustLog } from './stock-adjust-log.entity';
//import { StockIn, StockOut } from '.'; // 假设有导出

@Injectable()
export class StockCheckService {
  constructor(
    @InjectRepository(StockCheck)
    private stockCheckRepo: Repository<StockCheck>,
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    private dataSource: DataSource,
  ) {}

  async createCheck(data: { items: StockCheck['items']; operatorId: number }) {
    const checkNo = `CK${Date.now()}`;
    const check = this.stockCheckRepo.create({
      checkNo,
      items: data.items,
      operatorId: data.operatorId,
      status: 0, // 草稿
    });
    return this.stockCheckRepo.save(check);
  }

  async getPendingChecks() {
    return this.stockCheckRepo.find({ where: { status: 0 } });
  }

  async approveCheck(id: number, approverId: number) {
    const check = await this.stockCheckRepo.findOne({ where: { id } });
    if (!check) throw new NotFoundException('盘点单不存在');
    if (check.status !== 0) throw new BadRequestException('盘点单已处理');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const item of check.items) {
        const material = await queryRunner.manager.findOne(Material, {
          where: { id: item.materialId },
        });
        if (!material)
          throw new NotFoundException(`物料 ${item.materialId} 不存在`);

        const diff = item.actualQuantity - material.stock;
        if (diff !== 0) {
          // 记录调整日志
          const log = queryRunner.manager.create(StockAdjustLog, {
            materialId: item.materialId,
            beforeStock: material.stock,
            afterStock: item.actualQuantity,
            diff,
            reason: `盘点单 ${check.checkNo} 调整`,
            operatorId: approverId,
          });
          await queryRunner.manager.save(log);
          // 更新库存
          await queryRunner.manager.update(Material, item.materialId, {
            stock: item.actualQuantity,
          });
        }
      }
      await queryRunner.manager.update(StockCheck, id, {
        status: 2,
        approverId,
      });
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
    return { message: '盘点确认成功' };
  }

  async rejectCheck(id: number, reason: string) {
    await this.stockCheckRepo.update(id, { status: 3, rejectReason: reason });
  }
}
