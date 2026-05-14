import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockOut } from './stock-out.entity';

@Injectable()
export class StockOutService {
  constructor(
    @InjectRepository(StockOut)
    private stockOutRepo: Repository<StockOut>,
  ) {}

  async findPending(): Promise<StockOut[]> {
    return this.stockOutRepo.find({
      where: { status: 1 },
      order: { createdAt: 'DESC' },
    });
  }

  async approve(id: number): Promise<void> {
    const stockOut = await this.stockOutRepo.findOne({ where: { id } });
    if (!stockOut) throw new NotFoundException('出库单不存在');
    stockOut.status = 2;
    await this.stockOutRepo.save(stockOut);
  }

  async reject(id: number, reason: string): Promise<void> {
    const stockOut = await this.stockOutRepo.findOne({ where: { id } });
    if (!stockOut) throw new NotFoundException('出库单不存在');
    stockOut.status = 3;
    stockOut.rejectReason = reason;
    await this.stockOutRepo.save(stockOut);
  }
}
