import request, { type ApiResponse } from '@/utils/request';

// 定义物料类型
export interface Material {
  id: number;
  categoryId: number;
  name: string;
  spec?: string;
  unit?: string;
  price?: number;
  supplierId?: number;
  stock: number;
  minStock: number;
  maxStock: number;
  expiryDate?: string;
  status: number;
}

// 入库参数
export interface InboundParams {
  materialId: number;
  quantity: number;
  unitPrice?: number;
  supplierId?: number;
  remark?: string;
}

// 出库参数
export interface OutboundParams {
  materialId: number;
  outboundType?: string;
  quantity: number;
  reason: string;
  repairOrderId?: number;
}


export const getMaterialList = (params?: any): Promise<ApiResponse<Material[]>> => {
  return request.get('/material/list', { params });
};

export const inbound = (data: InboundParams): Promise<ApiResponse<any>> => {
  return request.post('/material/inbound', {
    ...data,
    supplierId: data.supplierId ? Number(data.supplierId) : undefined,
  });
};

export const outbound = (data: OutboundParams, operatorId: number): Promise<ApiResponse<any>> => {
  return request.post('/material/outbound', {
    ...data,
    applicantId: operatorId,
  });
};

export const getWarningList = (): Promise<ApiResponse<{
  lowStock: Material[];
  highStock: Material[];
  expiring: Material[];
}>> => {
  return request.get('/material/warning');
};