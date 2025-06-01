// 🌐 统一的 API 基础配置
export const API_ENDPOINTS = {
    // 后端 API 配置
    BACKEND: {
        BASE_URL: 'http://45.204.6.32:5000/api', // 后端服务器地址
    },
    // Cloudflare API 配置
    CLOUDFLARE: {
        BASE_URL: 'https://api.cloudflare.com/client/v4',
    }
} as const;

// API 通用配置
export const API_CONFIG = {
    TIMEOUT: 15000, // 增加超时时间，因为跨域请求可能较慢
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    // 后端 API 地址
    BASE_URL: API_ENDPOINTS.BACKEND.BASE_URL,
    // 跨域配置
    CORS: {
        withCredentials: false, // 跨域请求不发送 cookies
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    }
} as const;

// Cloudflare configuration
export const CLOUDFLARE_CONFIG = {
    // Bearer Token 方式（用于其他API调用）
    API_TOKEN: '7ZsOVSWsmckXjz5g5bOnyLcWEnLkwnnZf6tgptCd',

    // Email + API Key 方式（用于目标地址管理，按官方文档要求）
    API_EMAIL: '3586177963@qq.com', // 请替换为您的 Cloudflare 账户邮箱
    API_KEY: 'f1ee8a98265907148742928bb93a87cf322fc', // 请替换为您的 Global API Key

    ZONE_ID: '4b77e7738254c98795f1ffe4da0e19b9',
    ACCOUNT_ID: '40fda975fc0eb67e944a9d215f2c1152', // 请替换为您的真实 Cloudflare Account ID
    EMAIL_DOMAIN: '184772.xyz',
    // 通过后端代理所有 Cloudflare API 请求，避免 CORS 问题
    BASE_URL: API_ENDPOINTS.BACKEND.BASE_URL + '/cloudflare'
} as const;

// 配额配置
export const QUOTA_CONFIG = {
    WARNING_THRESHOLD: 3, // 配额警告阈值
    COLORS: {
        SUFFICIENT: '#3f8600',  // 配额充足
        WARNING: '#faad14',     // 配额不足
        DANGER: '#cf1322',      // 配额用完
    },
    STATUS_TYPES: {
        SUFFICIENT: 'success' as const,
        WARNING: 'warning' as const,
        DANGER: 'error' as const,
    }
} as const;

// 权限配置
export const PERMISSION_CONFIG = {
    ADMIN: 'admin' as const,
    USER: 'user' as const,
    COLORS: {
        ADMIN: '#52c41a',
        USER: '#1890ff',
    }
} as const;

// ⚠️ 已废弃：请使用 API_CONFIG.BASE_URL 和 CLOUDFLARE_CONFIG.BASE_URL
// export const BACKEND_API_URL = 'http://127.0.0.1:5000/api';
// export const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://api.cloudflare.com/client/v4';