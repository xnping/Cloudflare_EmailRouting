import axios, { type AxiosInstance } from 'axios';
import { API_CONFIG, CLOUDFLARE_CONFIG } from '../config';

// 创建后端API实例
export const backendApi: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    withCredentials: API_CONFIG.CORS.withCredentials,
    headers: {
        ...API_CONFIG.CORS.headers,
    },
});

// 创建Cloudflare API实例
export const cloudflareApi: AxiosInstance = axios.create({
    baseURL: CLOUDFLARE_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLOUDFLARE_CONFIG.API_TOKEN}`,
    },
});

// 通用请求拦截器
const addAuthInterceptor = (apiInstance: AxiosInstance, useCloudflareAuth = false) => {
    apiInstance.interceptors.request.use(
        (config) => {
            if (!useCloudflareAuth) {
                // 后端API使用JWT Token
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
};

// 通用响应拦截器
const addResponseInterceptor = (apiInstance: AxiosInstance, isBackend = true) => {
    apiInstance.interceptors.response.use(
        (response) => isBackend ? response.data : response,
        (error) => {
            if (error.response?.status === 401) {
                // Token过期或无效
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                window.location.href = '/login';
            }

            if (isBackend && error.response) {
                return Promise.reject(error.response.data);
            }
            return Promise.reject(error.response?.data || { message: '网络错误' });
        }
    );
};

// 应用拦截器
addAuthInterceptor(backendApi, false);
addAuthInterceptor(cloudflareApi, true);
addResponseInterceptor(backendApi, true);
addResponseInterceptor(cloudflareApi, false);

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData extends LoginData {
  email: string;
  permissions?: 'user' | 'admin'; // 内部使用，前端统一设置为 'user'
}

export interface User {
  id: number;
  username: string;
  email: string;
  frequency: number;
  permissions: 'user' | 'admin';
  // 功能使用次数统计
  usageStats?: {
    emailRouting: number;
    apiCalls: number;
    lastLoginTime?: string;
  };
}

// 后端返回的用户数据格式
export interface BackendUser {
  id: number;
  username: string;
  email: string;
  frequency: number;
  permissions: 'user' | 'admin';
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 兼容旧版本
export const api = backendApi;

export const authApi = {
  login: (data: LoginData) => backendApi.post<any, ApiResponse<{ user: BackendUser; token: string }>>('/login', data),
  register: (data: RegisterData) => backendApi.post<any, ApiResponse<{ user: BackendUser; token: string }>>('/register', data),
  getUserInfo: () => backendApi.get<any, ApiResponse<BackendUser>>('/user/info'),
  isAuthenticated: () => !!localStorage.getItem('token'),
};