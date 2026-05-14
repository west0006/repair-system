import http from '@/utils/request'

export const getNotifications = (params) => http.get('/notification/list', params)
export const markAsRead = (id) => http.patch(`/notification/${id}/read`)