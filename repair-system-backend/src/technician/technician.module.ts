import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicianService } from './technician.service';
import { TechnicianController } from './technician.controller';
import { Technician } from './technician.entity';
import { TechnicianBuilding } from './technician-building.entity';
import { RepairOrder } from '../order/order.entity';
import { Building } from '../building/building.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Technician,
      TechnicianBuilding,
      RepairOrder,
      Building,
    ]),
  ],
  providers: [TechnicianService],
  controllers: [TechnicianController],
  exports: [TechnicianService],
})
export class TechnicianModule {}
