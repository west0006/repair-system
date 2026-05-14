import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import OrderService from './order.service';
import { OrderController } from './order.controller';
import { RepairOrder } from './order.entity';
import { OrderLog } from './order-log.entity';
import { Technician } from '../technician/technician.entity';
import { MaterialModule } from '../material/material.module';
import { CommonModule } from '../common/common.module';
import { TechnicianModule } from '../technician/technician.module';
import { AutoDispatchService } from './auto-dispatch.service';
import { User } from '../auth/user.entity';
import { BuildingModule } from '../building/building.module';
import { RepairPositionModule } from '../technician/repair-position.module';
import { MaterialApplication } from '../material/material-application.entity';
import { Material } from '../material/material.entity';
import { StockOut } from '../material/stock-out.entity';
import { TechnicianBuilding } from '../technician/technician-building.entity';
import { WechatModule } from '../wechat/wechat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RepairOrder,
      OrderLog,
      Technician,
      User,
      MaterialApplication,
      Material,
      StockOut,
      TechnicianBuilding,
    ]),
    TechnicianModule,
    MaterialModule,
    CommonModule,
    BuildingModule,
    RepairPositionModule,
    WechatModule,
  ],
  providers: [OrderService, AutoDispatchService],
  controllers: [OrderController],
})
export class OrderModule {}
