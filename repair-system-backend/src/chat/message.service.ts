// chat/message.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { RepairOrder } from '../order/order.entity';
import { Message } from './message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { Technician } from '../technician/technician.entity';
import { OrderStatus } from '../order/order-status.enum';
import { Role } from '../auth/roles.enum';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RepairOrder)
    private readonly repairOrderRepo: Repository<RepairOrder>,
    @InjectRepository(Technician)
    private technicianRepo: Repository<Technician>,
  ) {}

  async validateChatPermission(
    orderId: number,
    userId: number,
    role: Role,
  ): Promise<RepairOrder | null> {
    const order = await this.repairOrderRepo.findOne({
      where: { id: orderId },
    });
    if (!order) return null;
    if (role === Role.Admin) return order;
    if (role === Role.Technician) {
      const tech = await this.technicianRepo.findOne({ where: { userId } });
      if (!tech) return null;
      return order.technicianId === tech.id ? order : null;
    }
    if (role === Role.User) return order.userId === userId ? order : null;
    return null;
  }

  async saveMessage(data: {
    orderId?: number;
    senderId: number;
    receiverId: number;
    senderType: number;
    content: string;
    type?: number;
  }) {
    const message = this.messageRepo.create(data);
    return this.messageRepo.save(message);
  }

  async send(dto: SendMessageDto & { sender_id: number }) {
    const msg = this.messageRepo.create({
      orderId: dto.order_id,
      senderId: dto.sender_id,
      receiverId: dto.receiver_id,
      senderType: dto.sender_type,
      content: dto.content,
      type: dto.type ?? 0,
      createdAt: new Date(),
    });
    await this.messageRepo.save(msg);
    return msg;
  }

  async getMessagesBetween(
    userId1: number,
    userId2: number,
  ): Promise<Message[]> {
    return this.messageRepo.find({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async getMessages(orderId: number, userId: number, userRole: Role) {
    const order = await this.repairOrderRepo.findOne({
      where: { id: orderId },
      select: ['userId', 'technicianId'],
    });
    if (!order) throw new NotFoundException('工单不存在');

    let currentTechnicianId: number | null = null;
    if (userRole === Role.Technician) {
      const tech = await this.technicianRepo.findOne({
        where: { userId: userId },
        select: ['id'],
      });
      if (tech) currentTechnicianId = tech.id;
    }

    let hasPermission = false;
    if (userRole === Role.Admin) hasPermission = true;
    else if (userRole === Role.Technician)
      hasPermission = order.technicianId === currentTechnicianId;
    else if (userRole === Role.User) hasPermission = order.userId === userId;

    if (!hasPermission) throw new ForbiddenException('无权查看该工单的消息');

    return this.messageRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  async getContacts(userId: number, role: Role): Promise<any[]> {
    // 1. 根据角色获取关联的用户列表（基于工单，而非聊天记录）
    let users: Pick<User, 'id' | 'name' | 'role' | 'phone' | 'avatar'>[] = [];

    if (role === Role.Admin) {
      // 管理员：返回所有非管理员用户（实际业务中管理员很少聊天，保留）
      users = await this.userRepo.find({
        select: ['id', 'name', 'role', 'phone', 'avatar'],
        where: { role: In([Role.User, Role.Technician]) },
        order: { id: 'ASC' },
      });
    } else if (role === Role.Technician) {
      // 师傅：所有我维修过的工单的报修人
      const technician = await this.technicianRepo.findOne({
        where: { userId },
        select: ['id'],
      });
      if (technician) {
        const orders = await this.repairOrderRepo.find({
          where: { technicianId: technician.id, userId: Not(IsNull()) },
          select: ['userId'],
        });
        const userIds = [...new Set(orders.map((o) => o.userId))];
        if (userIds.length) {
          users = await this.userRepo.find({
            where: { id: In(userIds) },
            select: ['id', 'name', 'role', 'phone', 'avatar'],
            order: { id: 'ASC' },
          });
        }
      }
    } else {
      // 普通用户：所有为我处理过工单的师傅
      const orders = await this.repairOrderRepo.find({
        where: { userId, technicianId: Not(IsNull()) },
        select: ['technicianId'],
      });
      const technicianIds = [...new Set(orders.map((o) => o.technicianId))];
      if (technicianIds.length) {
        const technicians = await this.technicianRepo.find({
          where: { id: In(technicianIds) },
          select: ['userId'],
        });
        const userIds = technicians.map((t) => t.userId);
        if (userIds.length) {
          users = await this.userRepo.find({
            where: { id: In(userIds) },
            select: ['id', 'name', 'role', 'phone', 'avatar'],
            order: { id: 'ASC' },
          });
        }
      }
    }

    if (users.length === 0) return [];

    // 2. 批量获取每个联系人的最后消息和未读数
    const results = [];
    for (const user of users) {
      const lastMessage = await this.messageRepo.findOne({
        where: [
          { senderId: userId, receiverId: user.id },
          { senderId: user.id, receiverId: userId },
        ],
        order: { createdAt: 'DESC' },
        select: ['content', 'type', 'createdAt'],
      });

      const unreadCount = await this.messageRepo.count({
        where: {
          senderId: user.id,
          receiverId: userId,
          isRead: 0,
        },
      });

      results.push({
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        lastMessage: lastMessage
          ? lastMessage.type === 1
            ? '[图片]'
            : lastMessage.content
          : '',
        lastTime: lastMessage?.createdAt || null,
        unreadCount,
      });
    }

    // 按最后消息时间倒序排列
    return results.sort((a, b) => {
      const tA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const tB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return tB - tA;
    });
  }

  async getActiveOrdersForUser(userId: number, role: Role): Promise<number[]> {
    if (role === Role.Admin) return [];

    const activeStatuses = [
      OrderStatus.DISPATCHED,
      OrderStatus.ACCEPTED,
      OrderStatus.ON_WAY,
      OrderStatus.REPAIRING,
      OrderStatus.WAITING_PARTS,
      OrderStatus.AWAITING_PAYMENT,
    ];

    const where: any = {
      status: In(activeStatuses),
    };

    if (role === Role.Technician) {
      const tech = await this.technicianRepo.findOne({
        where: { userId },
        select: ['id'],
      });
      if (!tech) return [];
      where.technicianId = tech.id;
    } else {
      where.userId = userId;
    }

    const orders = await this.repairOrderRepo.find({
      where,
      select: ['id'],
    });

    return orders.map((o) => o.id);
  }

  async getMessagesByUser(
    currentUserId: number,
    currentRole: number,
    targetUserId: number,
  ): Promise<Message[]> {
    const targetUser = await this.userRepo.findOne({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new NotFoundException('用户不存在');

    let currentTechnicianId: number | null = null;
    if (currentRole === Role.Technician) {
      const tech = await this.technicianRepo.findOne({
        where: { userId: currentUserId },
        select: ['id'],
      });
      if (tech) currentTechnicianId = tech.id;
    }

    let targetTechnicianId: number | null = null;
    if (targetUser.role === Role.Technician) {
      const tech = await this.technicianRepo.findOne({
        where: { userId: targetUserId },
        select: ['id'],
      });
      if (tech) targetTechnicianId = tech.id;
    }

    const conditions: Array<{ userId?: number; technicianId?: number }> = [];

    if (
      currentRole === Role.User &&
      targetUser.role === Role.Technician &&
      targetTechnicianId
    ) {
      conditions.push({
        userId: currentUserId,
        technicianId: targetTechnicianId,
      });
    } else if (
      currentRole === Role.Technician &&
      targetUser.role === Role.User &&
      currentTechnicianId
    ) {
      conditions.push({
        userId: targetUserId,
        technicianId: currentTechnicianId,
      });
    } else if (
      currentRole === Role.Technician &&
      targetUser.role === Role.Technician
    ) {
      return [];
    } else if (currentRole === Role.User && targetUser.role === Role.User) {
      return [];
    }

    if (conditions.length === 0) return [];

    const orders = await this.repairOrderRepo.find({
      where: conditions,
      select: ['id'],
    });
    const orderIds = orders.map((o) => o.id);
    if (orderIds.length === 0) return [];

    return this.messageRepo.find({
      where: { orderId: In(orderIds) },
      order: { createdAt: 'ASC' },
    });
  }

  async markMessagesAsRead(currentUserId: number, senderId: number) {
    await this.messageRepo.update(
      { receiverId: currentUserId, senderId, isRead: 0 },
      { isRead: 1 },
    );
  }
}
