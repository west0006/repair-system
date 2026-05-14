import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeoutReleaseStockService } from './timeout-release-stock.service';
import { MaterialApplication } from '../material/material-application.entity';
import { Material } from '../material/material.entity';
import { RepairOrder } from '../order/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaterialApplication, Material, RepairOrder]),
  ],
  providers: [TimeoutReleaseStockService],
})
export class TasksModule {}
