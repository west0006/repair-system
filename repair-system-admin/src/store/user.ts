import { defineStore } from 'pinia';
import { login as apiLogin } from '@/api/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: (() => {
      try {
        const info = localStorage.getItem('userInfo');
        return info ? JSON.parse(info) : {};
      } catch {
        return {};
      }
    })(),
  }),
  actions: {
    async login(username: string, password: string) {
      const res = await apiLogin(username, password);
      this.token = res.data.access_token;
      this.userInfo = res.data.user;
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      return res;
    },
    logout() {
      this.token = '';
      this.userInfo = {};
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    },
  },
  getters: {
    // 安全获取用户名
    userName: (state) => state.userInfo?.name || '未登录',
  },
});