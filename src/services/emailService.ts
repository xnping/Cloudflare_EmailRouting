import { backendApi } from './api';

import type { ApiResponse } from '../types/auth';

// 邮箱记录类型定义
export interface EmailRecord {
    id?: number;
    userId: number;
    email: string;      // sender@example.com (发送方地址，即自定义地址)
    toEmail: string;    // receiver@example.com (接收方地址，即用户注册邮箱)
    createdAt?: string;
    updatedAt?: string;
}

// 创建邮箱记录请求参数
export interface CreateEmailRecordRequest {
    userId: number;
    email: string;
    toEmail: string;
}

// 创建邮箱记录响应
export interface CreateEmailRecordResponse {
    id: number;
    userId: number;
    email: string;
    toEmail: string;
}

export const emailService = {
    /**
     * 测试后端API连接
     */
    async testConnection(): Promise<boolean> {
        try {
            console.log('Testing backend API connection...');
            const response = await backendApi.get('/health');
            console.log('Backend API health check response:', response);
            return response.data?.code === 200;
        } catch (error) {
            console.error('Backend API connection test failed:', error);
            return false;
        }
    },
    /**
     * 创建邮箱记录
     *
     * @param data 邮箱记录数据
     * @returns Promise<EmailRecord>
     */
    async createEmailRecord(data: CreateEmailRecordRequest): Promise<EmailRecord> {
        try {
            const response = await backendApi.post<ApiResponse<CreateEmailRecordResponse>>('/emails', data);

            if (response && typeof response === 'object') {
                if ('code' in response && 'message' in response) {
                    if (response.code !== 200) {
                        throw new Error((response as any).message || '创建邮箱记录失败');
                    }

                    const emailRecord = response.data;
                    if (!emailRecord) {
                        throw new Error('No email record data received');
                    }

                    return emailRecord as unknown as EmailRecord;
                } else {
                    return (response as any).data as EmailRecord;
                }
            }

            throw new Error('Invalid response format');
        } catch (error: any) {
            if (error && typeof error === 'object') {
                if ('code' in error && 'message' in error) {
                    throw new Error(error.message || '创建邮箱记录失败');
                }

                if (error.response) {
                    const status = error.response.status;
                    const responseData = error.response.data;

                    if (status === 401) {
                        throw new Error('认证失败，请重新登录');
                    } else if (status === 403) {
                        throw new Error('权限不足');
                    } else if (status === 404) {
                        throw new Error('API接口不存在，请检查后端服务');
                    } else if (status >= 500) {
                        throw new Error('服务器内部错误，请稍后重试');
                    } else if (responseData?.message) {
                        throw new Error(responseData.message);
                    } else {
                        throw new Error(`请求失败 (HTTP ${status})`);
                    }
                } else if (error.request) {
                    throw new Error('网络连接失败，请检查后端服务是否正常运行');
                } else if (error.message) {
                    throw new Error(error.message);
                }
            }

            if (typeof error === 'string') {
                throw new Error(error);
            }

            throw new Error('创建邮箱记录失败');
        }
    },

    /**
     * 获取用户的邮箱记录列表
     *
     * @param userId 用户ID
     * @returns Promise<EmailRecord[]>
     */
    async getUserEmailRecords(userId: number): Promise<EmailRecord[]> {
        try {
            const response = await backendApi.get(`/emails/user/${userId}`);

            if (Array.isArray(response.data)) {
                return response.data;
            }

            if (response.data && typeof response.data === 'object') {
                if (response.data.code === 200) {
                    return response.data.data || [];
                }

                if (response.data.code === 404 || response.data.message?.includes('没有找到') || response.data.message?.includes('无数据')) {
                    return [];
                }

                throw new Error(response.data.message || '获取邮箱记录失败');
            }

            return [];

        } catch (error: any) {
            if (error.response?.status === 404) {
                return [];
            }

            if (error.response?.data) {
                if (Array.isArray(error.response.data)) {
                    return error.response.data;
                }

                if (error.response.data.message) {
                    const message = error.response.data.message;
                    if (message.includes('没有找到') || message.includes('无数据') || message.includes('暂无')) {
                        return [];
                    }
                    throw new Error(message);
                }
            }

            if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
                return [];
            }

            throw new Error(error.message || '获取邮箱记录失败');
        }
    },

    /**
     * 删除邮箱记录
     *
     * @param emailId 邮箱记录ID
     * @returns Promise<void>
     */
    async deleteEmailRecord(emailId: number): Promise<void> {
        try {
            const response = await backendApi.delete<ApiResponse<any>>(`/emails/${emailId}`);

            if (response.data.code !== 200) {
                throw new Error(response.data.message || '删除邮箱记录失败');
            }
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error(error.message || '删除邮箱记录失败');
        }
    }
};
