import request from '@/utils/request';

export const getFaqList = (params: any) => request.get('/faq', { params });
export const createFaq = (data: any) => request.post('/faq', data);
export const updateFaq = (id: number, data: any) => request.put(`/faq/${id}`, data);
export const deleteFaq = (id: number) => request.delete(`/faq/${id}`);