import request from '@/utils/request';

export interface Category {
  id: number;
  name: string;
  parentId?: number;
  status: number; // 1-启用 2-禁用
}

export const getCategoryList = () => request.get('/category');
export const getCategoryTree = () => request.get('/category/tree');
export const createCategory = (data: Partial<Category>) => request.post('/category', data);
export const updateCategory = (id: number, data: Partial<Category>) => request.put(`/category/${id}`, data);
export const deleteCategory = (id: number) => request.delete(`/category/${id}`);
export const updateCategoryStatus = (id: number, status: number) => request.patch(`/category/${id}/status`, { status });