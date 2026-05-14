import { useUserStore } from '@/store/user'

// 开发环境使用 Vite 代理，BASE_URL 设为空或 '/api'
const BASE_URL = '/api'
const TIMEOUT = 15000

function request<T = any>(options : UniApp.RequestOptions) : Promise<T> {
  return new Promise((resolve, reject) => {
    const userStore = useUserStore()
    const token = userStore.token

    const header : any = {
      'Content-Type': 'application/json',
      ...options.header
    }
    if (token) {
      header.Authorization = `Bearer ${token}`
    }

    uni.request({
      url: BASE_URL + options.url,    // 实际请求 /api/auth/login → 被代理到 localhost:3000/auth/login
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: TIMEOUT,
      success: (res) => {
        const { code, message, data } = res.data as any
        if (code === 200 || code === 201) {
          resolve(data as T)
        } else if (code === 401) {
          userStore.logout()
          uni.navigateTo({ url: '/pages/login/login' })
          uni.showToast({ title: '登录已过期', icon: 'none' })
          reject(res.data)
        } else {
          uni.showToast({ title: message || '请求失败', icon: 'none' })
          reject(res.data)
        }
      },
      fail: (err) => {
        console.error('请求失败', err)
        let msg = '网络异常，请检查网络连接'
        if (err.errMsg?.includes('timeout')) {
          msg = '请求超时，请稍后重试'
        } else if (err.errMsg?.includes('fail')) {
          msg = '服务器连接失败，请检查后端服务'
        }
        uni.showToast({ title: msg, icon: 'none', duration: 2000 })
        reject(err)
      }
    })
  })
}

const http = {
  get: <T = any>(url : string, params ?: any) => request<T>({ url, method: 'GET', data: params }),
  post: <T = any>(url : string, data ?: any) => request<T>({ url, method: 'POST', data }),
  put: <T = any>(url : string, data ?: any) => request<T>({ url, method: 'PUT', data }),
  patch: <T = any>(url : string, data ?: any) => request<T>({ url, method: 'PATCH', data }),
  delete: <T = any>(url : string, data ?: any) => request<T>({ url, method: 'DELETE', data })
}
export { http }
export default http