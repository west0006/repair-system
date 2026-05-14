import http from '@/utils/request'

export const getBuildingList = () => http.get('/building/list')