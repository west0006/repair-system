import request from '@/utils/request';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export const getNotifications = () => request.get('/notification/list'); // 假设后端有该接口，需确认
export const markAsRead = (id: number) => request.patch(`/notification/${id}/read`);