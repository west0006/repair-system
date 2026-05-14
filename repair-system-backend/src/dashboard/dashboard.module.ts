import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { RepairOrder } from '../order/order.entity';
import { Material } from '../material/material.entity';
import { Technician } from '../technician/technician.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RepairOrder, Material, Technician])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
