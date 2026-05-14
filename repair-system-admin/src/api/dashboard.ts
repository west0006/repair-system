import request from '@/utils/request'

export const getStats = () => request.get('/dashboard/stats').then(res => res.data)
export const getOrderTrend = () => request.get('/dashboard/trend').then(res => res.data)
export const getFaultHeatmap = () => request.get('/dashboard/fault-heatmap').then(res => res.data)
export const getFaultTypes = () => request.get('/dashboard/fault-types').then(res => res.data)
export const getWorkload = () => request.get('/dashboard/workload').then(res => res.data)