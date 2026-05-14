// store/user.js
import { defineStore } from 'pinia';
import { login as apiLogin } from '@/api/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
    userInfo: (() => {
      const stored = uni.getStorageSync('userInfo');
      if (!stored) return null;
      // 如果存储的是对象（旧版本直接存储的对象），直接返回；否则尝试解析
      if (typeof stored === 'object') return stored;
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    })()
  }),
  actions: {
    async login(username, password) {
      const data = await apiLogin(username, password);
      this.token = data.access_token;
      this.userInfo = data.user;
      uni.setStorageSync('token', this.token);
      // 关键：存储时转为 JSON 字符串
      uni.setStorageSync('userInfo', JSON.stringify(this.userInfo));
      return data;
    },
    logout() {
      this.token = '';
      this.userInfo = null;
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
      uni.reLaunch({ url: '/pages/login/login' });
    }
  },
  getters: {
    role: (state) => state.userInfo?.role,
    userName: (state) => state.userInfo?.name || ''
  }
});