import request from '@/utils/request';

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  status: number; // 1-合作中 2-暂停合作
  createdAt: string;
}

export const getSupplierList = () => request.get('/supplier');
export const createSupplier = (data: Partial<Supplier>) => request.post('/supplier', data);
export const updateSupplier = (id: number, data: Partial<Supplier>) => request.put(`/supplier/${id}`, data);
export const deleteSupplier = (id: number) => request.delete(`/supplier/${id}`);
export const updateSupplierStatus = (id: number, status: number) => request.patch(`/supplier/${id}/status`, { status });