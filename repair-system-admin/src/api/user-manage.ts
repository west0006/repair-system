import request from '@/utils/request';

export interface User {
  id: number;
  username: string;
  name: string;
  phone: string;
  role: number;
  createdAt: string;
}

export const getUserList = (params: any) =>
  request.get('/admin/users', { params });

export const updateUser = (id: number, data: Partial<User>) =>
  request.put(`/admin/users/${id}`, data);

export const importUsers = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/admin/users/import', formData);
};