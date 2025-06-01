import { backendApi } from './api';
import { authService } from './authService';
import type { ApiResponse, User } from '../types/auth';

// 修改用户频次请求参数
export interface UpdateFrequencyRequest {
    userId: number;
    frequency: number;
}

// 修改用户频次响应
export interface UpdateFrequencyResponse {
    id: number;
    username: string;
    email: string;
    frequency: number;
    permissions: 'user' | 'admin';
}

// 卡密充值请求参数
export interface CardRechargeRequest {
    code: string;
}

// 充值记录
export interface RechargeRecord {
    id: number;
    userId: number;
    username: string;
    cardCode?: string;
    amount: number;
    type: 'card' | 'admin';
    beforeBalance: number;
    afterBalance: number;
    description: string;
    createdAt: string;
}

export const userService = {
    /**
     * 检查用户是否有足够的配额
     *
     * @param currentFrequency 当前配额数量
     * @returns boolean
     */
    hasQuota(currentFrequency: number): boolean {
        return currentFrequency > 0;
    },

    /**
     * 修改用户使用频次
     *
     * @param data 频次更新数据
     * @returns Promise<User>
     */
    async updateFrequency(data: UpdateFrequencyRequest): Promise<User> {
        try {
            const response = await backendApi.put<ApiResponse<UpdateFrequencyResponse>>('/user/frequency', data);

            if (response && typeof response === 'object') {
                if ('code' in response && 'message' in response) {
                    if (response.code !== 200) {
                        throw new Error((response as any).message || '更新用户频次失败');
                    }

                    const userData = response.data;
                    if (!userData) {
                        throw new Error('后端未返回用户数据');
                    }

                    return userData as unknown as User;
                } else {
                    if ('id' in response && 'frequency' in response) {
                        return response as unknown as User;
                    } else {
                        throw new Error('响应数据格式不正确');
                    }
                }
            }

            throw new Error('Invalid response format');
        } catch (error: any) {
            if (error && typeof error === 'object') {
                if ('code' in error && 'message' in error) {
                    throw new Error(error.message || '更新用户频次失败');
                }

                if (error.response) {
                    const status = error.response.status;
                    const responseData = error.response.data;

                    if (status === 403) {
                        throw new Error('权限不足：无法修改用户频次，请检查是否为管理员或修改自己的频次');
                    } else if (status === 404) {
                        throw new Error('用户不存在或接口不存在');
                    } else if (status === 400) {
                        throw new Error(responseData?.message || '请求参数错误');
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

            throw new Error('更新用户频次失败');
        }
    },

    /**
     * 更新当前用户的频次（避免权限问题）
     *
     * @param newFrequency 新的频次值
     * @returns Promise<User>
     */
    async updateCurrentUserFrequency(newFrequency: number): Promise<User> {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('用户未登录');
            }

            const updateData = {
                userId: currentUser.id,
                frequency: newFrequency
            };

            return await this.updateFrequency(updateData);
        } catch (error: any) {
            throw error;
        }
    },

    /**
     * 消耗用户配额（frequency - 1）
     *
     * @param userId 用户ID
     * @param currentFrequency 当前剩余配额数量
     * @returns Promise<User>
     */
    async consumeQuota(userId: number, currentFrequency: number): Promise<User> {
        if (currentFrequency <= 0) {
            throw new Error('配额不足，无法创建邮件转发');
        }

        const newFrequency = currentFrequency - 1;

        try {
            const numericUserId = Number(userId);
            if (isNaN(numericUserId)) {
                throw new Error('用户ID格式错误');
            }

            const updatedUser = await this.updateCurrentUserFrequency(newFrequency);
            return updatedUser;
        } catch (error: any) {
            throw new Error(error.message || '配额消耗失败');
        }
    },



    /**
     * 获取配额状态描述
     */
    getQuotaStatus(frequency: number): string {
        if (frequency <= 0) {
            return '配额已用完';
        } else if (frequency <= 5) {
            return '配额不足';
        } else if (frequency <= 20) {
            return '配额正常';
        } else {
            return '配额充足';
        }
    },

    /**
     * 获取配额状态类型（用于UI显示）
     */
    getQuotaStatusType(frequency: number): 'success' | 'warning' | 'error' {
        if (frequency <= 0) {
            return 'error';
        } else if (frequency <= 5) {
            return 'warning';
        } else {
            return 'success';
        }
    },

    /**
     * 获取配额状态颜色
     */
    getQuotaStatusColor(frequency: number): string {
        if (frequency <= 0) {
            return '#ff4d4f';  // 红色
        } else if (frequency <= 5) {
            return '#faad14';  // 橙色
        } else {
            return '#52c41a';  // 绿色
        }
    },

    /**
     * 使用卡密充值
     *
     * @param data 卡密充值请求数据
     * @returns Promise<User>
     */
    async rechargeWithCard(data: CardRechargeRequest): Promise<User> {
        try {
            const response = await backendApi.post<ApiResponse<UpdateFrequencyResponse>>('/recharge/card', data);

            if (response && typeof response === 'object') {
                if ('code' in response && 'message' in response) {
                    if (response.code !== 200) {
                        throw new Error((response as any).message || '卡密充值失败');
                    }

                    const userData = response.data;
                    if (!userData) {
                        throw new Error('No user data received');
                    }

                    return userData as unknown as User;
                } else {
                    if ('id' in response && 'frequency' in response) {
                        return response as unknown as User;
                    } else {
                        throw new Error('响应数据格式不正确');
                    }
                }
            }

            throw new Error('Invalid response format');
        } catch (error: any) {
            if (error && typeof error === 'object') {
                if ('code' in error && 'message' in error) {
                    throw new Error(error.message || '卡密充值失败');
                }

                if (error.response) {
                    const responseData = error.response.data;
                    if (responseData?.message) {
                        throw new Error(responseData.message);
                    }
                } else if (error.message) {
                    throw new Error(error.message);
                }
            }

            if (typeof error === 'string') {
                throw new Error(error);
            }

            throw new Error('卡密充值失败');
        }
    },

    /**
     * 获取当前用户充值记录
     *
     * @returns Promise<RechargeRecord[]>
     */
    async getRechargeRecords(): Promise<RechargeRecord[]> {
        try {
            const response = await backendApi.get('/recharge/records');

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

                throw new Error(response.data.message || '获取充值记录失败');
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

            throw new Error(error.message || '获取充值记录失败');
        }
    }
};
