import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeoutAlertService } from './timeout-alert.service';
import { MaterialWarningService } from '../material/material-warning.service';
import { RepairOrder } from '../order/order.entity';
import { User } from '../auth/user.entity';
import { Material } from '../material/material.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([RepairOrder, User, Material]),
    CommonModule,
  ],
  providers: [TimeoutAlertService, MaterialWarningService],
  exports: [TimeoutAlertService, MaterialWarningService],
})
export class NotificationModule {}
