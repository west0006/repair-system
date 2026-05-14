import http from '@/utils/request'

export const getMessages = (orderId) => http.get(`/chat/messages/${orderId}`)
export const getMessagesByUser = (userId) => http.get(`/chat/messages/user/${userId}`)
export const getContacts = () => http.get('/message/contacts')
export const markMessagesAsRead = (userId) => http.post(`/chat/messages/read/${userId}`)
export const sendMessage = (data) => http.post('/message/send', data)