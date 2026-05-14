import { defineStore } from 'pinia'
import http from '@/utils/request'

interface UserInfo {
  id : number
  username : string
  role : number
  name ?: string
  phone ?: string
  avatar ?: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '' as string,
    userInfo: {} as UserInfo,
    role: 0 as number
  }),
  actions: {
    // 从本地存储恢复登录状态
    initUserInfo() {
      try {
        const token = uni.getStorageSync('token')
        const userInfoStr = uni.getStorageSync('userInfo')
        if (token && userInfoStr) {
          const userInfo = JSON.parse(userInfoStr)
          this.token = token
          this.userInfo = userInfo
          this.role = userInfo.role
        }
      } catch (err) {
        console.error('恢复用户信息失败', err)
        this.resetState()
      }
    },

    async login(username : string, password : string) {
      const res = await http.post<{ access_token : string; user : UserInfo }>('/auth/login', { username, password })
      if (!res.access_token) throw new Error('登录响应异常')
      this.loginSuccess(res.access_token, res.user)
    },

    loginSuccess(token : string, user : UserInfo) {
      this.token = token
      this.userInfo = user
      this.role = user.role
      uni.setStorageSync('token', token)
      uni.setStorageSync('userInfo', JSON.stringify(user))
    },

    // 仅清除登录信息，保留语言偏好等其他数据
    resetState() {
      this.token = ''
      this.userInfo = {} as UserInfo
      this.role = 0
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
    },

    logout() {
      this.resetState()
      uni.navigateTo({ url: '/pages/login/login' })
    }
  }
})