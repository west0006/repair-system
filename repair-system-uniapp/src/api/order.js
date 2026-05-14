import http from '@/utils/request'

// 普通用户
export const submitOrder = (data) => http.post('/order/submit', data)
export const getUserOrders = () => http.get('/order/list')
export const getOrderDetail = (id) => http.get(`/order/detail/${id}`)
export const evaluateOrder = (orderId, score, comment) =>
  http.post('/order/evaluate', {
    orderId,
    score,
    comment
  })
export const payMaterialBill = (orderId) => http.post(`/order/${orderId}/pay`)

// 师傅端
export const getPendingOrders = (params) => http.get('/order/pending', params)
export const acceptOrder = (id) => http.post(`/order/accept/${id}`)
export const rejectOrder = (id, reason) => http.post(`/order/reject/${id}`, {
  reason
})
export const updateOrderStatus = (id, status) =>
  http.post(`/order/status/${id}`, {
    status
  })
export const getTechnicianOrders = (params) => http.get('/order/my', params)
export const completeOrder = (id, data) => http.post(`/order/complete/${id}`, data)