import request from '@/utils/request';

// 获取待审核出库单列表
export const getPendingStockOuts = () => request.get('/stock-out/pending');

// 审核通过出库单
export const approveStockOut = (id) => request.post(`/stock-out/${id}/approve`);

// 驳回出库单
export const rejectStockOut = (id, reason) => request.post(`/stock-out/${id}/reject`, { reason });