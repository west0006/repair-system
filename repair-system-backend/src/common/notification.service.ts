import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async create(data: {
    userId: number;
    title: string;
    content: string;
    link?: string;
  }): Promise<Notification> {
    const notification = this.notificationRepo.create(data);
    await this.notificationRepo.save(notification);
    return notification;
  }

  async findByUserId(userId: number): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: number): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('通知不存在');
    await this.notificationRepo.update(id, { isRead: true });
  }
}
