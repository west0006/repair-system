import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { Material } from './material.entity';
import { StockIn } from './stock-in.entity';
import { StockOut } from './stock-out.entity';
import { MaterialApplication } from './material-application.entity';
import { Category } from './category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { StockCheckService } from './stock-check.service';
import { StockCheck } from './stock-check.entity';
import { StockCheckController } from './stock-check.controller';
import { Supplier } from './supplier.entity';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { StockAdjustLog } from './stock-adjust-log.entity';
import { RepairOrder } from '../order/order.entity';
import { StockOutService } from './stock-out.service';
import { StockOutController } from './stock-out.controller';
import { NotificationModule } from '../notification/notification.module';
import { CommonModule } from '../common/common.module';
import { WechatModule } from '../wechat/wechat.module';
import { User } from '../auth/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Material,
      StockIn,
      StockOut,
      MaterialApplication,
      Category,
      StockCheck,
      Supplier,
      StockAdjustLog,
      RepairOrder,
      User,
    ]),
    CommonModule,
    NotificationModule,
    WechatModule,
  ],
  providers: [
    MaterialService,
    CategoryService,
    StockCheckService,
    SupplierService,
    StockOutService,
  ],
  controllers: [
    MaterialController,
    CategoryController,
    StockCheckController,
    SupplierController,
    StockOutController,
  ],
  exports: [MaterialService, CategoryService, SupplierService],
})
export class MaterialModule {}
