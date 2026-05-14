import request from '@/utils/request';

// 获取工单列表（管理员）
export const getOrderList = (params) => {
  // 后端接受 page, limit, status, orderNo, userName, startDate, endDate
  // 前端传入的 pageSize 需改为 limit
  const { page, pageSize, dateRange, ...rest } = params;
  const query = {
    page,
    limit: pageSize,
    ...rest,
  };
  if (dateRange && dateRange.length === 2) {
    query.startDate = dateRange[0];
    query.endDate = dateRange[1];
  }
  return request.get('/order/admin/list', { params: query });
};

export const getOrderDetail = (id) => {
  return request.get(`/order/detail/${id}`);
};

export const approveOrder = (id: number, autoDispatch: boolean = true) => {
  return request.post(`/order/admin/approve/${id}`, { autoDispatch });
};

export const rejectOrder = (id, reason) => {
  return request.post(`/order/admin/reject/${id}`, { reason });
};

export const dispatchOrder = (id, technicianId) => {
  return request.post(`/order/admin/dispatch/${id}`, { technicianId });
};

export const exportOrders = (params: any) => {
  return request.get('/order/admin/export', { params, responseType: 'blob' });
};

export const getOrderLogs = (id) => {
  return request.get(`/order/logs/${id}`);
};