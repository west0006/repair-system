import http from '@/utils/request'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const uploadFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.uploadFile({
      url: `/api/upload`,
      filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success(res) {
        try {
          const result = JSON.parse(res.data)
          const data = result.data || result
          if (data.code === 200 || data.url) {
            const relativeUrl = data.url
            const fullUrl = relativeUrl.startsWith('http') ? relativeUrl : `${BASE_URL}${relativeUrl}`
            resolve(fullUrl)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch (err) {
          reject(new Error('响应解析失败'))
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}