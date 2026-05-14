// chat/chat.controller.ts
import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RequestWithUser } from '../types/request-with-user';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private messageService: MessageService) {}

  @Get('messages/:orderId')
  @Roles(Role.User, Role.Technician, Role.Admin) // 所有角色都可查看自己的工单消息
  async getMessages(
    @Param('orderId') orderId: string,
    @Request() req: RequestWithUser,
  ) {
    const messages = await this.messageService.getMessages(
      +orderId,
      req.user.id,
      req.user.role,
    );
    return { code: 200, data: messages };
  }

  @Get('messages/user/:userId')
  async getMessagesByUser(
    @Param('userId') userId: string,
    @Request() req: RequestWithUser,
  ) {
    const targetUserId = parseInt(userId, 10);
    if (isNaN(targetUserId)) {
      return { code: 400, message: '无效的用户ID' };
    }
    const messages = await this.messageService.getMessagesBetween(
      req.user.id,
      targetUserId,
    );
    return { code: 200, data: messages };
  }

  @Post('messages/read/:userId')
  @UseGuards(JwtAuthGuard)
  async markMessagesAsRead(
    @Param('userId') targetUserId: string,
    @Request() req: RequestWithUser,
  ) {
    await this.messageService.markMessagesAsRead(req.user.id, +targetUserId);
    return { code: 200 };
  }
}
