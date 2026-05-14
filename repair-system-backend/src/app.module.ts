import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { TechnicianModule } from './technician/technician.module';
import { MaterialModule } from './material/material.module';
import { ChatModule } from './chat/chat.module';
import { UploadController } from './common/upload.controller';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CommonModule } from './common/common.module';
import { TasksModule } from './schedule/tasks.module';
import { UserManageModule } from './user-manage/user-manage.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';
import { FaqModule } from './faq/faq.module';
import { WechatModule } from './wechat/wechat.module';

@Module({
  imports: [
    // 定时任务模块（必须在根模块导入）
    ScheduleModule.forRoot(),
    // 环境变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: true,
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    TasksModule,
    NotificationModule,
    OrderModule,
    TechnicianModule,
    MaterialModule,
    ChatModule,
    DashboardModule,
    CommonModule,
    UserManageModule,
    FaqModule,
    WechatModule,
  ],
  controllers: [UploadController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 先认证
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 再鉴权
    },
  ],
})
export class AppModule {}
