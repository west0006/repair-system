import request from '@/utils/request';

export interface MaterialApplication {
  id: number;
  orderId: number;
  applicantId: number;
  items: { materialId: number; quantity: number }[];
  reason?: string;
  status: number; // 1-待审批 2-已通过 3-已驳回
  approverId?: number;
  rejectReason?: string;
  createdAt: string;
}

export const getMaterialApplications = (params?: { paymentStatus?: number }) =>
  request.get('/material/applications', { params });
export const approveApplication = (id: number) => request.post(`/material/application/${id}/approve`);
export const rejectApplication = (id: number, reason: string) => request.post(`/material/application/${id}/reject`, { reason });