import http from '@/utils/request'

export const getMaterialList = (params) => http.get('/material/list', params)
export const applyMaterial = (data) => http.post('/order/material-apply', data)