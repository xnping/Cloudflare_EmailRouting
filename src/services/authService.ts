import axios from 'axios';
import type { ApiResponse, AuthResponseData, LoginRequest, RegisterRequest, User, BackendUser } from '../types/auth';
import { cloudflareApi } from './cloudflareApi';
import { API_CONFIG } from '../config';

// 创建axios实例 - 使用统一配置
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    withCredentials: API_CONFIG.CORS.withCredentials,
    headers: {
        ...API_CONFIG.CORS.headers,
    }
});

// 添加请求拦截器来注入token
api.interceptors.request.use(
    (config) => {
        // 优先从localStorage读取，然后从sessionStorage读取
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 存储策略
const getStorage = (remember: boolean = false) => {
    return remember ? localStorage : sessionStorage;
};

// 将后端用户数据转换为前端用户数据（添加模拟的使用统计）
const transformBackendUser = (backendUser: BackendUser): User => {
    // 从本地存储获取或生成模拟的使用统计
    const storageKey = `userStats_${backendUser.id}`;
    let usageStats = JSON.parse(localStorage.getItem(storageKey) || 'null');

    if (!usageStats) {
        // 生成模拟的使用统计数据
        const emailRoutingUsed = Math.floor(Math.random() * (backendUser.frequency || 50));
        usageStats = {
            emailRouting: emailRoutingUsed,
            apiCalls: Math.floor(Math.random() * 200) + emailRoutingUsed,
            lastLoginTime: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(usageStats));
    } else {
        // 更新最后登录时间
        usageStats.lastLoginTime = new Date().toISOString();
        localStorage.setItem(storageKey, JSON.stringify(usageStats));
    }

    return {
        ...backendUser,
        usageStats
    };
};

export const authService = {
    async login(data: LoginRequest & { remember?: boolean }): Promise<AuthResponseData> {
        try {

            const response = await api.post<ApiResponse<{ user: BackendUser; token: string }>>('/login', {
                username: data.username,
                password: data.password
            });



            if (response.data.code !== 200) {
                throw new Error(response.data.message);
            }

            const responseData = response.data.data;
            if (!responseData || !responseData.token || !responseData.user) {
                throw new Error('Invalid response data: missing token or user info');
            }

            // 转换后端用户数据为前端用户数据（添加使用统计）
            const transformedUser = transformBackendUser(responseData.user);

            // 构造认证数据
            const authData: AuthResponseData = {
                token: responseData.token,
                user: transformedUser
            };

            // 根据"记住我"选择存储策略
            const storage = getStorage(data.remember);

            // 清除另一个存储中的数据（避免冲突）
            const otherStorage = data.remember ? sessionStorage : localStorage;
            otherStorage.removeItem('token');
            otherStorage.removeItem('user');
            otherStorage.removeItem('rememberMe');

            // 存储认证信息
            storage.setItem('token', authData.token);
            storage.setItem('user', JSON.stringify(authData.user));
            storage.setItem('rememberMe', data.remember ? 'true' : 'false');



            return authData;
        } catch (error: any) {

            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    },

    async register(data: RegisterRequest): Promise<AuthResponseData> {
        try {
            // 构造注册请求数据，如果没有指定权限则默认为 'user'
            const registerData = {
                username: data.username,
                password: data.password,
                email: data.email,
                permissions: data.permissions || 'user'
            };

            const response = await api.post<ApiResponse<{ user: BackendUser; token: string }>>('/register', registerData);

            if (response.data.code !== 200) {
                throw new Error(response.data.message);
            }

            const responseData = response.data.data;
            if (!responseData || !responseData.token || !responseData.user) {
                throw new Error('Invalid response data: missing token or user info');
            }

            const transformedUser = transformBackendUser(responseData.user);

            const authData: AuthResponseData = {
                token: responseData.token,
                user: transformedUser
            };

            localStorage.setItem('token', authData.token);
            localStorage.setItem('user', JSON.stringify(authData.user));
            localStorage.setItem('rememberMe', 'true');

            try {
                try {
                    await cloudflareApi.getDestinationAddresses();
                } catch (permError: any) {
                    // Continue with destination address creation
                }

                await cloudflareApi.createDestinationAddress(data.email);

            } catch (error: any) {
                // Destination address creation failure doesn't affect registration
            }

            return authData;
        } catch (error: any) {
            if (error.message && error.message.includes('org.h2.jdbc.JdbcSQLSyntaxErrorException')) {
                throw new Error('后端数据库配置错误：表名 "user" 是保留关键字，请联系管理员修复');
            }

            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            if (typeof error === 'string') {
                throw new Error(error);
            }

            if (error.message) {
                throw new Error(error.message);
            }

            throw new Error('注册失败：未知错误');
        }
    },

    logout() {
        // 清除两种存储中的数据
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('rememberMe');
    },

    getCurrentUser() {
        // 优先从localStorage读取，然后从sessionStorage读取
        let userStr = localStorage.getItem('user');
        if (!userStr) {
            userStr = sessionStorage.getItem('user');
        }
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    },

    getToken() {
        // 优先从localStorage读取，然后从sessionStorage读取
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    // 获取记住我状态
    getRememberMe(): boolean {
        const rememberMe = localStorage.getItem('rememberMe') || sessionStorage.getItem('rememberMe');
        return rememberMe === 'true';
    },

    // 获取保存的用户名（用于记住我功能）
    getSavedUsername(): string | null {
        if (this.getRememberMe()) {
            const user = this.getCurrentUser();
            return user?.username || null;
        }
        return null;
    },

    // 获取用户信息
    async getUserInfo(): Promise<User> {
        try {
            const response = await api.get<ApiResponse<BackendUser>>('/user/info');

            if (response.data.code !== 200) {
                throw new Error(response.data.message);
            }

            const backendUserData = response.data.data;
            if (!backendUserData) {
                throw new Error('No user data received');
            }

            // 转换后端用户数据为前端用户数据（添加使用统计）
            const transformedUser = transformBackendUser(backendUserData);

            // 更新本地存储的用户信息
            const storage = this.getRememberMe() ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(transformedUser));

            return transformedUser;
        } catch (error: any) {

            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    }
};