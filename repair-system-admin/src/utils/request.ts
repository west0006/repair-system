import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

// 定义后端统一返回格式
export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data: T;
  [key: string]: any;
}

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;

    // 有 code 字段（业务状态码）
    if (res.code !== undefined) {
      if (res.code !== 200) {
        ElMessage.error(res.message || '请求失败');
        if (res.code === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(new Error(res.message || 'Error'));
      }
      return res as any; // 直接返回原始结构，包含 data
    }

    // 无 code 字段，包装为统一格式
    return { code: 200, data: res } as ApiResponse;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        ElMessage.error('登录已过期，请重新登录');
      } else if (status === 403) {
        ElMessage.error('没有权限访问');
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在');
      } else if (status === 500) {
        ElMessage.error('服务器内部错误');
      } else {
        ElMessage.error(data?.message || `请求失败 (${status})`);
      }
    } else if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      ElMessage.error('请求超时，请稍后重试');
    } else if (error.message === 'Network Error') {
      ElMessage.error('网络连接异常，请检查网络');
    } else {
      ElMessage.error(error.message || '请求失败');
    }
    return Promise.reject(error);
  }
);

export default instance;