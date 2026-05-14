// src/message/message.controller.ts

import {
  Controller,
  Post,
  Body,
  Req,
  UploadedFile,
  UseInterceptors,
  Get,
  Query,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageService } from './message.service';
import { RequestWithUser } from '../types/request-with-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // 文本/图片统一接口
  @Post('send')
  @UseInterceptors(FileInterceptor('file'))
  async sendMsg(
    @Body() dto: SendMessageDto,
    @Req() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // 权限校验
    if (dto.order_id !== undefined) {
      const order = await this.messageService.validateChatPermission(
        dto.order_id,
        req.user.id,
        req.user.role,
      );
      if (!order) {
        throw new ForbiddenException('无权发送消息');
      }
    }

    let content = dto.content;
    if (dto.type === 1 && file) {
      // 这里假设上传到/public/uploads，可换为oss等
      content = `/uploads/${file.filename}`;
    }
    return this.messageService.send({
      ...dto,
      content,
      sender_id: req.user.id,
    });
  }

  @Get('list')
  async getMessageList(
    @Query('order_id') order_id: number,
    @Req() req: RequestWithUser,
  ) {
    const messages = await this.messageService.getMessages(
      order_id,
      req.user.id,
      req.user.role,
    );
    return { code: 200, data: messages };
  }

  @Get('contacts')
  async getContacts(@Req() req: RequestWithUser) {
    const contacts = await this.messageService.getContacts(
      req.user.id,
      req.user.role,
    );
    return { code: 200, data: contacts };
  }
}
