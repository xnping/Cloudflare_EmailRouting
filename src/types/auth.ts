export interface User {
    id: number;
    username: string;
    email: string;
    frequency: number;
    permissions: 'user' | 'admin';
    // 功能使用次数统计（可选，前端模拟）
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

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    permissions?: 'user' | 'admin'; // 内部使用，前端统一设置为 'user'
}

export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data?: T;
}

export interface AuthResponseData {
    user: User;
    token: string;
}