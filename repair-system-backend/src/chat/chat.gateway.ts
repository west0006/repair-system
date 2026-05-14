// chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessageService } from './message.service';

// 扩展 Socket 类型，明确 data 结构
interface CustomSocket extends Socket {
  data: {
    userId: number;
    role: number;
  };
}

// 定义消息发送的数据结构
interface SendMessageData {
  receiverId: number;
  orderId?: number;
  content: string;
  type: string;
}

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private messageService: MessageService,
  ) {}

  async handleConnection(client: CustomSocket) {
    const token = (client.handshake.auth as any).token;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        role: number;
      }>(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(`user_${payload.sub}`);

      // 自动加入关联工单房间
      const orders = await this.messageService.getActiveOrdersForUser(
        payload.sub,
        payload.role,
      );
      orders.forEach((orderId) => client.join(`order_${orderId}`));
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() orderId: number,
    @ConnectedSocket() client: CustomSocket,
  ) {
    client.join(`order_${orderId}`);
  }

  @SubscribeMessage('leave')
  handleLeave(
    @MessageBody() orderId: number,
    @ConnectedSocket() client: CustomSocket,
  ) {
    client.leave(`order_${orderId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: SendMessageData,
    @ConnectedSocket() client: CustomSocket,
  ) {
    const userId = client.data.userId;
    const role = client.data.role;

    try {
      if (data.orderId) {
        const order = await this.messageService.validateChatPermission(
          data.orderId,
          userId,
          role,
        );
        if (!order) {
          client.emit('error', { message: '无权发送消息' });
          return;
        }
      }

      const savedMessage = await this.messageService.saveMessage({
        orderId: data.orderId,
        senderId: userId,
        senderType: role,
        content: data.content,
        receiverId: data.receiverId,
        type: data.type === 'image' ? 1 : 0,
      });
      this.server
        .to(`user_${data.receiverId}`)
        .emit('newMessage', savedMessage);
      client.emit('newMessage', savedMessage);
    } catch (error) {
      console.error('发送消息失败', error);
      client.emit('error', { message: '发送消息失败，请重试' });
    }
  }
}
