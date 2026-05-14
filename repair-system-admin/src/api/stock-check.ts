import request from '@/utils/request';

export interface StockCheckItem {
  materialId: number;
  actualQuantity: number;
  note?: string;
}

export const createStockCheck = (items: StockCheckItem[]) =>
  request.post('/stock-check', { items });

export const getPendingStockChecks = () => request.get('/stock-check/pending');
export const approveStockCheck = (id: number) => request.post(`/stock-check/${id}/approve`);
export const rejectStockCheck = (id: number, reason: string) => request.post(`/stock-check/${id}/reject`, { reason });