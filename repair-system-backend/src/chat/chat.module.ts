// chat/chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { MessageService } from './message.service';
import { Message } from './message.entity';
import { User } from '../auth/user.entity';
import { RepairOrder } from '../order/order.entity';
import { MessageController } from './message.controller';
import { Technician } from '../technician/technician.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, RepairOrder, Technician]),
    // 确保 JwtService 可用（已在全局提供，但此处显式导入以保证依赖清晰）
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway, MessageService],
  controllers: [ChatController, MessageController],
})
export class ChatModule {}
