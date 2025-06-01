import axios, { type InternalAxiosRequestConfig } from 'axios';
import { CLOUDFLARE_CONFIG } from '../config';

// Validate environment variables
const validateConfig = () => {
    const missingVars = [];

    if (!CLOUDFLARE_CONFIG.ZONE_ID) {
        missingVars.push('VITE_CLOUDFLARE_ZONE_ID');
    }
    if (!CLOUDFLARE_CONFIG.API_TOKEN) {
        missingVars.push('VITE_CLOUDFLARE_API_TOKEN');
    }
    if (!CLOUDFLARE_CONFIG.EMAIL_DOMAIN) {
        missingVars.push('VITE_CLOUDFLARE_EMAIL_DOMAIN');
    }
    // Account ID is optional for now
    if (!CLOUDFLARE_CONFIG.ACCOUNT_ID || CLOUDFLARE_CONFIG.ACCOUNT_ID === '40fda975fc0eb67e944a9d215f2c1152') {
        // Account ID not configured - destination address management will not be available
    }

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVars.join(', ')}\n` +
            'Please create a .env file in the project root with these variables.'
        );
    }
};

// Validate config immediately
validateConfig();

// 主要的 API 实例（使用 Bearer Token）
const api = axios.create({
    baseURL: CLOUDFLARE_CONFIG.BASE_URL,
    headers: {
        'Authorization': `Bearer ${CLOUDFLARE_CONFIG.API_TOKEN}`,
        'Content-Type': 'application/json',
    },
    // Add CORS support for development
    withCredentials: false,
});

// 专门用于目标地址管理的 API 实例（使用 Email + API Key）
const destinationApi = axios.create({
    baseURL: CLOUDFLARE_CONFIG.BASE_URL,
    headers: {
        'X-Auth-Email': CLOUDFLARE_CONFIG.API_EMAIL,
        'X-Auth-Key': CLOUDFLARE_CONFIG.API_KEY,
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

// Request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
const addResponseInterceptor = (apiInstance: any, name: string) => {
    apiInstance.interceptors.response.use(
        (response: any) => {
            return response;
        },
        (error: any) => {
            return Promise.reject(error);
        }
    );
};

// 应用拦截器
addResponseInterceptor(api, 'Main API');
addResponseInterceptor(destinationApi, 'Destination API');

// Email Routing Rule types
export type EmailDestination = {
    id?: string;
    name?: string;
    matchers: Array<{
        type: "literal" | "regexp";
        field: "to";
        value: string;
    }>;
    actions: Array<{
        type: "forward" | "worker" | "drop";
        value: string[];
    }>;
    enabled?: boolean;
    created?: string;
    modified?: string;
}

// Destination Address types (based on Cloudflare API documentation)
export type DestinationAddress = {
    id?: string;
    email: string;
    created?: string;
    modified?: string;
    verified?: string; // ISO 8601 timestamp when the address was verified
    tag?: string; // Optional tag for the address
}

// Cloudflare API response wrapper
export type CloudflareApiResponse<T> = {
    success: boolean;
    errors: Array<{
        code: number;
        message: string;
        documentation_url?: string;
        source?: {
            pointer: string;
        };
    }>;
    messages: Array<{
        code: number;
        message: string;
        documentation_url?: string;
        source?: {
            pointer: string;
        };
    }>;
    result: T;
}

export const cloudflareApi = {
    // ===== API Token 测试 =====

    /**
     * 测试 API Token 权限
     */
    async testApiToken(): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            const response = await api.get(`/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}`);

            if (response.data.success) {
                try {
                    const emailResponse = await api.get(`/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/email/routing/addresses`);
                    if (emailResponse.data.success) {
                        return {
                            success: true,
                            message: 'API Token 权限正常',
                            details: {
                                account: response.data.result,
                                emailRouting: emailResponse.data.result
                            }
                        };
                    }
                } catch (emailError: any) {
                    return {
                        success: false,
                        message: 'API Token 缺少 Email Routing 权限',
                        details: emailError.response?.data
                    };
                }
            }

            return {
                success: false,
                message: 'API Token 测试失败',
                details: response.data
            };

        } catch (error: any) {
            return {
                success: false,
                message: `API Token 测试失败: ${error.response?.data?.errors?.[0]?.message || error.message}`,
                details: error.response?.data
            };
        }
    },

    // Get all email routing rules
    async getDestinations() {
        try {
            const response = await api.get(`/zones/${CLOUDFLARE_CONFIG.ZONE_ID}/email/routing/rules`);

            if (!response.data.success) {
                throw new Error(response.data.errors?.[0]?.message || '获取规则失败');
            }

            return response.data.result;
        } catch (error) {
            throw error;
        }
    },

    // Create new email routing rule
    async createDestination(customPrefix: string, forwardTo: string) {
        const rule = {
            name: `Forward ${customPrefix}@${CLOUDFLARE_CONFIG.EMAIL_DOMAIN} to ${forwardTo}`,
            enabled: true,
            matchers: [{
                type: "literal" as const,
                field: "to" as const,
                value: `${customPrefix}@${CLOUDFLARE_CONFIG.EMAIL_DOMAIN}`.toLowerCase()
            }],
            actions: [{
                type: "forward" as const,
                value: [forwardTo.toLowerCase()]
            }]
        };

        try {
            const response = await api.post(
                `/zones/${CLOUDFLARE_CONFIG.ZONE_ID}/email/routing/rules`,
                rule
            );
            if (!response.data.success) {
                throw new Error(response.data.errors?.[0]?.message || '创建规则失败');
            }
            return response.data.result;
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const errorMessage = error.response.data.errors[0]?.message;
                throw new Error(errorMessage || '创建规则失败');
            }
            throw error;
        }
    },

    // Update email routing rule
    async updateDestination(id: string, customPrefix: string, forwardTo: string) {
        const rule = {
            name: `Forward ${customPrefix}@${CLOUDFLARE_CONFIG.EMAIL_DOMAIN} to ${forwardTo}`,
            enabled: true,
            matcher: {
                type: "literal" as const,
                field: "to" as const,
                value: `${customPrefix}@${CLOUDFLARE_CONFIG.EMAIL_DOMAIN}`.toLowerCase()
            },
            action: {
                type: "forward" as const,
                value: [forwardTo.toLowerCase()]
            }
        };

        try {
            const response = await api.put(
                `/zones/${CLOUDFLARE_CONFIG.ZONE_ID}/email/routing/rules/${id}`,
                rule
            );
            if (!response.data.success) {
                throw new Error(response.data.errors?.[0]?.message || '更新规则失败');
            }
            return response.data.result;
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const errorMessage = error.response.data.errors[0]?.message;
                throw new Error(errorMessage || '更新规则失败');
            }
            throw error;
        }
    },

    // Delete email routing rule
    async deleteDestination(id: string) {
        try {
            const response = await api.delete(
                `/zones/${CLOUDFLARE_CONFIG.ZONE_ID}/email/routing/rules/${id}`
            );
            if (!response.data.success) {
                throw new Error(response.data.errors?.[0]?.message || '删除规则失败');
            }
            return response.data.result;
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const errorMessage = error.response.data.errors[0]?.message;
                throw new Error(errorMessage || '删除规则失败');
            }
            throw error;
        }
    },

    // ===== Destination Address Management =====
    // Based on Cloudflare API: https://developers.cloudflare.com/api/resources/email_routing/subresources/addresses/

    /**
     * Create a destination address to forward your emails to.
     * Destination addresses need to be verified before they can be used.
     *
     * @param email - The email address to create as a destination
     * @returns Promise<DestinationAddress>
     */
    async createDestinationAddress(email: string): Promise<DestinationAddress> {
        // 检查Account ID配置
        if (!CLOUDFLARE_CONFIG.ACCOUNT_ID) {
            throw new Error('Account ID is required for destination address management. Please configure ACCOUNT_ID in src/config.ts.');
        }



        try {
            const requestBody = {
                email: email.toLowerCase()
            };

            const response = await destinationApi.post<CloudflareApiResponse<DestinationAddress>>(
                `/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/email/routing/addresses`,
                requestBody
            );

            if (!response.data.success) {
                throw new Error(response.data.errors?.[0]?.message || '创建目标地址失败');
            }

            return response.data.result;
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const errorMessage = error.response.data.errors[0]?.message;
                const errorCode = error.response.data.errors[0]?.code;
                throw new Error(`${errorMessage || '创建目标地址失败'} (错误码: ${errorCode || 'unknown'})`);
            }
            throw error;
        }
    },

    /**
     * List all destination addresses for the account
     *
     * @returns Promise<DestinationAddress[]>
     */
    async getDestinationAddresses(): Promise<DestinationAddress[]> {
        if (!CLOUDFLARE_CONFIG.ACCOUNT_ID || CLOUDFLARE_CONFIG.ACCOUNT_ID === '40fda975fc0eb67e944a9d215f2c1152') {
            throw new Error('Account ID is required for destination address management. Please configure ACCOUNT_ID in src/config.ts.');
        }

        try {
            const response = await api.get<CloudflareApiResponse<DestinationAddress[]>>(
                `/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/email/routing/addresses`
            );

            if (!response.data.success) {
                throw new Error(response.data.errors?.[0]?.message || '获取目标地址失败');
            }

            return Array.isArray(response.data.result) ? response.data.result : [];
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const errorMessage = error.response.data.errors[0]?.message;
                throw new Error(errorMessage || '获取目标地址失败');
            }
            throw error;
        }
    },

    /**
     * Get information for a specific destination address
     *
     * @param addressId - The ID of the destination address
     * @returns Promise<DestinationAddress>
     */
    async getDestinationAddress(addressId: string): Promise<DestinationAddress> {
        if (!CLOUDFLARE_CONFIG.ACCOUNT_ID || CLOUDFLARE_CONFIG.ACCOUNT_ID === '40fda975fc0eb67e944a9d215f2c1152') {
            throw new Error('Account ID is required for destination address management. Please configure ACCOUNT_ID in src/config.ts.');
        }

        try {
            const response = await api.get<CloudflareApiResponse<DestinationAddress>>(
                `/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/email/routing/addresses/${addressId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.errors?.[0]?.message || '获取目标地址详情失败');
            }

            return response.data.result;
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const errorMessage = error.response.data.errors[0]?.message;
                throw new Error(errorMessage || '获取目标地址详情失败');
            }
            throw error;
        }
    },

    /**
     * Delete a specific destination address
     *
     * @param addressId - The ID of the destination address to delete
     * @returns Promise<DestinationAddress>
     */
    async deleteDestinationAddress(addressId: string): Promise<DestinationAddress> {
        if (!CLOUDFLARE_CONFIG.ACCOUNT_ID || CLOUDFLARE_CONFIG.ACCOUNT_ID === '40fda975fc0eb67e944a9d215f2c1152') {
            throw new Error('Account ID is required for destination address management. Please configure ACCOUNT_ID in src/config.ts.');
        }

        try {
            const response = await api.delete<CloudflareApiResponse<DestinationAddress>>(
                `/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/email/routing/addresses/${addressId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.errors?.[0]?.message || '删除目标地址失败');
            }

            return response.data.result;
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const errorMessage = error.response.data.errors[0]?.message;
                throw new Error(errorMessage || '删除目标地址失败');
            }
            throw error;
        }
    }
};