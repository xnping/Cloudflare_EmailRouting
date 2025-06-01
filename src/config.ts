// API 基础配置
export const API_CONFIG = {
    BASE_URL: 'http://127.0.0.1:5000/api',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
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
    BASE_URL: 'https://api.cloudflare.com/client/v4',
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

// Backend API URL - 更新为远程服务器地址
export const BACKEND_API_URL = 'http://8.138.177.105:5000/api';

// Cloudflare API URL
export const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://api.cloudflare.com/client/v4';