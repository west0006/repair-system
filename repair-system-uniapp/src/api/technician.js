import http from '@/utils/request'

export const updateTechnicianStatus = (status) => http.patch('/technician/status', {
  status
})
export const getTechnicianStats = () => http.get('/technician/stats')