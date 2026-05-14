import request from '@/utils/request';

export const login = (username: string, password: string) => {
  return request.post('/auth/login', { username, password });
};

export const register = (data: any) => {
  return request.post('/auth/register', data);
};