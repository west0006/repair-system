import http from '@/utils/request'

export const predictFaq = (keyword) => http.post('/faq/predict', {
  keyword
})
export const getFaqList = () => http.get('/faq/public-list')