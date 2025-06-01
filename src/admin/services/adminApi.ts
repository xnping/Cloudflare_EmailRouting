import { backendApi } from '../../services/api';
import type { ApiResponse, User } from '../../types/auth';

// 分页响应类型
export interface PageResponse<T> {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages: number;
}

// 用户管理相关类型
export interface AdminUser extends User {
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserRequest {
    username?: string;
    password?: string;
    email?: string;
    permissions?: 'user' | 'admin';
    frequency?: number;
}

export interface UpdatePermissionsRequest {
    user_id: number;
    permissions: 'user' | 'admin';
}

export interface UpdateFrequencyRequest {
    userId: number;
    frequency: number;
}

// 邮件记录类型
export interface EmailRecord {
    id: number;
    userId: number;
    email: string;
    toEmail: string;
    createdAt: string;
    updatedAt: string;
}

export interface AdminEmailRecord extends EmailRecord {
    username: string;
}

export interface CreateEmailRequest {
    userId: number;
    email: string;
    toEmail: string;
}

export interface UpdateEmailRequest {
    userId: number;
    email: string;
    toEmail: string;
}

// 卡密管理类型
export interface CardCode {
    id: number;
    code: string;
    value: number;
    status: 'unused' | 'used' | 'disabled';
    usedByUserId?: number;
    usedByUsername?: string;
    usedAt?: string;
    expiresAt?: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface AdminCardCode extends CardCode {
    usedBy?: string;
}

export interface CreateCardCodeRequest {
    value: number;
    count: number;
    validDays?: number;
    description: string;
}

// 充值记录类型
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

export interface AdminRechargeRecord extends RechargeRecord {
    adminId?: number;
    adminName?: string;
}

export interface AdminRechargeRequest {
    userId: number;
    amount: number;
    description?: string;
}

export interface CardRechargeRequest {
    code: string;
}

// 统计数据类型
export interface DashboardStats {
    totalUsers: number;
    totalEmails: number;
    totalAdmins: number;
    totalActiveUsers: number;
    totalCardCodes: number;
    totalRechargeRecords: number;
    recentUsers: AdminUser[];
    recentEmails: EmailRecord[];
    recentCardCodes: CardCode[];
    recentRechargeRecords: RechargeRecord[];
    userGrowth: Array<{ date: string; count: number }>;
    emailGrowth: Array<{ date: string; count: number }>;
    rechargeGrowth: Array<{ date: string; count: number }>;
}

// 系统配置类型
export interface AdminSystemConfig {
    siteName: string;
    siteDescription: string;
    defaultQuota: number;
    maxQuota: number;
    allowRegistration: boolean;
    emailNotification: boolean;
    maintenanceMode: boolean;
    apiRateLimit: number;
    sessionTimeout: number;
}

// 系统状态类型
export interface AdminSystemStatus {
    uptime: string;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeUsers: number;
    totalRequests: number;
    errorRate: number;
}

/**
 * 后台管理API服务
 * 基于api.md接口文档实现的真实API调用
 */
export const adminApi = {
    // ==================== 测试和调试 ====================

    /**
     * 测试API连接
     */
    async testConnection(): Promise<void> {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers: any = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            await backendApi.get('/user/info', { headers });
        } catch (error) {
            throw error;
        }
    },

    /**
     * 测试管理员权限
     */
    async testAdminPermission(): Promise<boolean> {
        try {
            console.log('测试管理员权限...');

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                console.log('没有Token，无法测试权限');
                return false;
            }

            // 解析Token查看用户ID
            try {
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    console.log('Token解析结果:', payload);
                    console.log('Token中的用户ID:', payload.sub || payload.userId || payload.id);
                    console.log('Token过期时间:', new Date(payload.exp * 1000));
                }
            } catch (e) {
                console.error('Token解析失败:', e);
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // 尝试调用需要管理员权限的接口
            const response = await backendApi.get('/users', { headers });
            console.log('管理员权限测试成功:', response);
            return true;
        } catch (error: any) {
            console.error('管理员权限测试失败:', error);
            if (error.response?.status === 403) {
                console.error('权限不足：Token中的用户ID在数据库中不存在，或用户不是管理员');
                console.error('建议：重新登录或使用有效的管理员账户');
            }
            return false;
        }
    },

    /**
     * 检查Token有效性并重新登录
     */
    async validateTokenAndRelogin(): Promise<boolean> {
        try {
            console.log('检查Token有效性...');

            // 先尝试获取当前用户信息
            const response = await backendApi.get('/user/info');
            console.log('Token有效，用户信息:', response);
            return true;
        } catch (error) {
            console.error('Token无效:', error);

            // 清除无效的认证信息
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');

            console.log('已清除无效的认证信息，请重新登录');

            // 重定向到登录页面
            window.location.href = '/login';
            return false;
        }
    },

    // ==================== 用户管理 ====================

    /**
     * 获取所有用户列表
     * 接口: GET /api/users
     */
    async getAllUsers(): Promise<AdminUser[]> {
        try {
            console.log('正在调用 GET /api/users...');
            console.log('API Base URL:', backendApi.defaults.baseURL);

            // 手动获取token并设置请求头
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            console.log('使用Token:', token ? `${token.substring(0, 50)}...` : '无Token');

            const headers: any = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            console.log('请求头:', headers);

            const response: ApiResponse<AdminUser[]> = await backendApi.get('/users', { headers });
            console.log('API响应:', response);

            if (response.code !== 200) {
                throw new Error(response.message || '获取用户列表失败');
            }
            return response.data || [];
        } catch (error: any) {
            if (error.response) {
                if (error.response.status === 401) {
                    throw new Error('认证失败，请重新登录');
                } else if (error.response.status === 403) {
                    throw new Error('权限不足，需要管理员权限');
                } else if (error.response.status === 404) {
                    throw new Error('API接口不存在');
                } else if (error.response.status >= 500) {
                    throw new Error('服务器内部错误');
                } else {
                    throw new Error(error.response.data?.message || `请求失败 (${error.response.status})`);
                }
            } else if (error.request) {
                throw new Error('网络连接失败，请检查后端服务是否正常运行');
            } else {
                throw new Error('请求配置错误: ' + error.message);
            }
        }
    },

    /**
     * 分页获取用户列表
     * 接口: GET /api/users/page
     */
    async getUsersPage(pageNum = 1, pageSize = 10): Promise<PageResponse<AdminUser>> {
        const response: ApiResponse<PageResponse<AdminUser>> = await backendApi.get(`/users/page?pageNum=${pageNum}&pageSize=${pageSize}`);
        if (response.code !== 200) {
            throw new Error(response.message || '获取用户分页列表失败');
        }
        return response.data!;
    },

    /**
     * 获取用户列表（支持搜索和分页）
     * 这是一个适配函数，用于管理后台的用户管理页面
     */
    async getUsers(params: {
        page?: number;
        pageSize?: number;
        search?: string;
    } = {}): Promise<{ users: AdminUser[]; total: number }> {
        const { page = 1, pageSize = 10, search } = params;

        if (search) {
            // 如果有搜索条件，先获取所有用户然后过滤
            const allUsers = await this.getAllUsers();
            const filteredUsers = allUsers.filter(user =>
                user.username.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase())
            );

            // 手动分页
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const users = filteredUsers.slice(startIndex, endIndex);

            return {
                users,
                total: filteredUsers.length
            };
        } else {
            // 没有搜索条件，直接使用分页接口
            const pageResponse = await this.getUsersPage(page, pageSize);
            return {
                users: pageResponse.records,
                total: pageResponse.total
            };
        }
    },

    /**
     * 根据ID获取用户信息
     * 接口: GET /api/users/{id}
     */
    async getUserById(id: number): Promise<AdminUser> {
        const response: ApiResponse<AdminUser> = await backendApi.get(`/users/${id}`);
        if (response.code !== 200) {
            throw new Error(response.message || '获取用户信息失败');
        }
        return response.data!;
    },

    /**
     * 更新用户信息
     * 接口: PUT /api/users/{id}
     */
    async updateUser(id: number, data: UpdateUserRequest): Promise<AdminUser> {
        const response: ApiResponse<AdminUser> = await backendApi.put(`/users/${id}`, data);
        if (response.code !== 200) {
            throw new Error(response.message || '更新用户信息失败');
        }
        return response.data!;
    },

    /**
     * 修改用户权限
     * 接口: PUT /api/user/permissions
     */
    async updateUserPermissions(data: UpdatePermissionsRequest): Promise<AdminUser> {
        const response: ApiResponse<AdminUser> = await backendApi.put('/user/permissions', data);
        if (response.code !== 200) {
            throw new Error(response.message || '修改用户权限失败');
        }
        return response.data!;
    },

    /**
     * 修改用户频次
     * 接口: PUT /api/user/frequency
     */
    async updateUserFrequency(data: UpdateFrequencyRequest): Promise<AdminUser> {
        const response: ApiResponse<AdminUser> = await backendApi.put('/user/frequency', data);
        if (response.code !== 200) {
            throw new Error(response.message || '修改用户频次失败');
        }
        return response.data!;
    },

    /**
     * 创建用户（管理员功能）
     * 接口: POST /api/register
     */
    async createUser(userData: {
        username: string;
        email: string;
        password: string;
        permissions: string;
        frequency?: number;
    }): Promise<AdminUser> {
        const response: ApiResponse<{ user: AdminUser; token: string }> = await backendApi.post('/register', {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            permissions: userData.permissions
        });

        if (response.code !== 200) {
            throw new Error(response.message || '创建用户失败');
        }

        // 如果指定了初始频次且不为默认值，需要额外设置
        if (userData.frequency && userData.frequency !== 0) {
            try {
                await this.updateUserFrequency({ userId: response.data!.user.id, frequency: userData.frequency });
                return {
                    ...response.data!.user,
                    frequency: userData.frequency
                };
            } catch (err) {
                console.warn('设置初始频次失败:', err);
                return response.data!.user;
            }
        }

        return response.data!.user;
    },

    /**
     * 为用户充值频次 (+1)
     * 接口: POST /api/user/{userId}/frequency/increment
     */
    async incrementUserFrequency(userId: number): Promise<AdminUser> {
        const response: ApiResponse<AdminUser> = await backendApi.post(`/user/${userId}/frequency/increment`);
        if (response.code !== 200) {
            throw new Error(response.message || '充值用户频次失败');
        }
        return response.data!;
    },

    /**
     * 删除用户
     * 接口: DELETE /api/users/{id}
     */
    async deleteUser(id: number): Promise<void> {
        const response: ApiResponse<void> = await backendApi.delete(`/users/${id}`);
        if (response.code !== 200) {
            throw new Error(response.message || '删除用户失败');
        }
    },



    /**
     * 批量删除用户
     * 接口: DELETE /api/users/batch
     */
    async batchDeleteUsers(ids: number[]): Promise<void> {
        const response: ApiResponse<void> = await backendApi.delete('/users/batch', { data: ids });
        if (response.code !== 200) {
            throw new Error(response.message || '批量删除用户失败');
        }
    },

    // ==================== 邮件管理 ====================

    /**
     * 获取所有邮件记录
     * 接口: GET /api/emails
     */
    async getAllEmails(): Promise<EmailRecord[]> {
        const response: ApiResponse<EmailRecord[]> = await backendApi.get('/emails');
        if (response.code !== 200) {
            throw new Error(response.message || '获取邮件记录失败');
        }
        return response.data || [];
    },

    /**
     * 分页获取邮件记录
     * 接口: GET /api/emails/page
     */
    async getEmailsPage(pageNum = 1, pageSize = 10): Promise<PageResponse<EmailRecord>> {
        const response: ApiResponse<PageResponse<EmailRecord>> = await backendApi.get(`/emails/page?pageNum=${pageNum}&pageSize=${pageSize}`);
        if (response.code !== 200) {
            throw new Error(response.message || '获取邮件分页列表失败');
        }
        return response.data!;
    },

    /**
     * 获取邮件列表（支持搜索和分页）
     * 这是一个适配函数，用于管理后台的邮件管理页面
     */
    async getEmails(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        status?: string;
    } = {}): Promise<{ emails: AdminEmailRecord[]; total: number }> {
        const { page = 1, pageSize = 10, search } = params;

        // 获取所有邮件记录
        const allEmails = await this.getAllEmails();

        // 转换为 AdminEmailRecord 格式
        const adminEmails: AdminEmailRecord[] = allEmails.map(email => ({
            ...email,
            username: `user_${email.userId}` // 这里可能需要根据实际情况调整
        }));

        // 应用过滤条件
        let filteredEmails = adminEmails;

        if (search) {
            filteredEmails = filteredEmails.filter(email =>
                email.email.toLowerCase().includes(search.toLowerCase()) ||
                email.toEmail.toLowerCase().includes(search.toLowerCase()) ||
                email.username.toLowerCase().includes(search.toLowerCase())
            );
        }

        // 手动分页
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const emails = filteredEmails.slice(startIndex, endIndex);

        return {
            emails,
            total: filteredEmails.length
        };
    },

    /**
     * 根据ID获取邮件记录
     * 接口: GET /api/emails/{id}
     */
    async getEmailById(id: number): Promise<EmailRecord> {
        const response: ApiResponse<EmailRecord> = await backendApi.get(`/emails/${id}`);
        if (response.code !== 200) {
            throw new Error(response.message || '获取邮件记录失败');
        }
        return response.data!;
    },

    /**
     * 根据用户ID获取邮件记录
     * 接口: GET /api/emails/user/{userId}
     */
    async getEmailsByUserId(userId: number): Promise<EmailRecord[]> {
        const response: ApiResponse<EmailRecord[]> = await backendApi.get(`/emails/user/${userId}`);
        if (response.code !== 200) {
            throw new Error(response.message || '获取用户邮件记录失败');
        }
        return response.data || [];
    },

    /**
     * 创建邮件记录
     * 接口: POST /api/emails
     */
    async createEmail(data: CreateEmailRequest): Promise<EmailRecord> {
        const response: ApiResponse<EmailRecord> = await backendApi.post('/emails', data);
        if (response.code !== 200) {
            throw new Error(response.message || '创建邮件记录失败');
        }
        return response.data!;
    },

    /**
     * 更新邮件记录
     * 接口: PUT /api/emails/{id}
     */
    async updateEmail(id: number, data: UpdateEmailRequest): Promise<EmailRecord> {
        const response: ApiResponse<EmailRecord> = await backendApi.put(`/emails/${id}`, data);
        if (response.code !== 200) {
            throw new Error(response.message || '更新邮件记录失败');
        }
        return response.data!;
    },

    /**
     * 创建邮件转发规则（管理员功能）
     * 接口: POST /api/emails
     */
    async createEmailForAdmin(emailData: {
        userId: string;
        email: string;
        toEmail: string;
    }): Promise<AdminEmailRecord> {
        const response: ApiResponse<EmailRecord> = await backendApi.post('/emails', {
            userId: parseInt(emailData.userId),
            email: emailData.email,
            toEmail: emailData.toEmail
        });

        if (response.code !== 200) {
            throw new Error(response.message || '创建邮件转发规则失败');
        }

        // 转换为 AdminEmailRecord 格式
        return {
            ...response.data!,
            username: `user_${response.data!.userId}` // 这里可能需要根据实际情况调整
        };
    },



    /**
     * 删除邮件记录
     * 接口: DELETE /api/emails/{id}
     */
    async deleteEmail(id: number): Promise<void> {
        const response: ApiResponse<void> = await backendApi.delete(`/emails/${id}`);
        if (response.code !== 200) {
            throw new Error(response.message || '删除邮件记录失败');
        }
    },

    /**
     * 批量删除邮件记录
     * 接口: DELETE /api/emails/batch
     */
    async batchDeleteEmails(ids: number[]): Promise<void> {
        const response: ApiResponse<void> = await backendApi.delete('/emails/batch', { data: ids });
        if (response.code !== 200) {
            throw new Error(response.message || '批量删除邮件记录失败');
        }
    },

    // ==================== 卡密管理 ====================

    /**
     * 生成卡密
     * 接口: POST /api/card-codes/generate
     */
    async generateCardCodes(data: CreateCardCodeRequest): Promise<CardCode[]> {
        const response: ApiResponse<CardCode[]> = await backendApi.post('/card-codes/generate', data);
        if (response.code !== 200) {
            throw new Error(response.message || '生成卡密失败');
        }
        return response.data!;
    },

    /**
     * 生成卡密（管理员功能）
     * 接口: POST /api/card-codes/generate
     */
    async generateCardCodesForAdmin(generateData: {
        count: number;
        value: number;
        expiresAt?: string;
        description: string;
    }): Promise<AdminCardCode[]> {
        // 计算有效天数
        let validDays: number | null = null;
        if (generateData.expiresAt) {
            const expiresDate = new Date(generateData.expiresAt);
            const now = new Date();
            const diffTime = expiresDate.getTime() - now.getTime();
            validDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        const response: ApiResponse<CardCode[]> = await backendApi.post('/card-codes/generate', {
            value: generateData.value,
            count: generateData.count,
            validDays: validDays,
            description: generateData.description
        });

        if (response.code !== 200) {
            throw new Error(response.message || '生成卡密失败');
        }

        // 转换为 AdminCardCode 格式
        return response.data!.map(cardCode => ({
            ...cardCode,
            usedBy: cardCode.usedByUsername
        }));
    },

    /**
     * 获取所有卡密
     * 接口: GET /api/card-codes
     */
    async getAllCardCodes(): Promise<CardCode[]> {
        const response: ApiResponse<CardCode[]> = await backendApi.get('/card-codes');
        if (response.code !== 200) {
            throw new Error(response.message || '获取卡密列表失败');
        }
        return response.data || [];
    },

    /**
     * 分页获取卡密
     * 接口: GET /api/card-codes/page
     */
    async getCardCodesPage(pageNum = 1, pageSize = 10): Promise<PageResponse<CardCode>> {
        const response: ApiResponse<PageResponse<CardCode>> = await backendApi.get(`/card-codes/page?pageNum=${pageNum}&pageSize=${pageSize}`);
        if (response.code !== 200) {
            throw new Error(response.message || '获取卡密分页列表失败');
        }
        return response.data!;
    },

    /**
     * 获取卡密列表（支持搜索和分页）
     * 这是一个适配函数，用于管理后台的卡密管理页面
     */
    async getCardCodes(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        status?: string;
    } = {}): Promise<{ cardCodes: AdminCardCode[]; total: number }> {
        const { page = 1, pageSize = 10, search, status } = params;

        // 获取所有卡密
        const allCardCodes = await this.getAllCardCodes();

        // 转换为 AdminCardCode 格式
        const adminCardCodes: AdminCardCode[] = allCardCodes.map(cardCode => ({
            ...cardCode,
            usedBy: cardCode.usedByUsername,
            usedAt: cardCode.usedAt
        }));

        // 应用过滤条件
        let filteredCardCodes = adminCardCodes;

        if (search) {
            filteredCardCodes = filteredCardCodes.filter(cardCode =>
                cardCode.code.toLowerCase().includes(search.toLowerCase()) ||
                (cardCode.usedBy && cardCode.usedBy.toLowerCase().includes(search.toLowerCase()))
            );
        }

        if (status && status !== 'all') {
            // 状态映射：unused -> active, used -> used, disabled -> disabled
            const mappedStatus = status === 'active' ? 'unused' : status;
            filteredCardCodes = filteredCardCodes.filter(cardCode => cardCode.status === mappedStatus);
        }

        // 手动分页
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const cardCodes = filteredCardCodes.slice(startIndex, endIndex);

        return {
            cardCodes,
            total: filteredCardCodes.length
        };
    },

    /**
     * 禁用卡密
     * 接口: PUT /api/card-codes/{id}/disable
     */
    async disableCardCode(id: number): Promise<CardCode> {
        const response: ApiResponse<CardCode> = await backendApi.put(`/card-codes/${id}/disable`);
        if (response.code !== 200) {
            throw new Error(response.message || '禁用卡密失败');
        }
        return response.data!;
    },

    /**
     * 启用卡密
     * 接口: PUT /api/card-codes/{id}/enable
     */
    async enableCardCode(id: number): Promise<CardCode> {
        const response: ApiResponse<CardCode> = await backendApi.put(`/card-codes/${id}/enable`);
        if (response.code !== 200) {
            throw new Error(response.message || '启用卡密失败');
        }
        return response.data!;
    },

    /**
     * 删除卡密
     * 接口: DELETE /api/card-codes/{id}
     */
    async deleteCardCode(id: number): Promise<void> {
        const response: ApiResponse<void> = await backendApi.delete(`/card-codes/${id}`);
        if (response.code !== 200) {
            throw new Error(response.message || '删除卡密失败');
        }
    },

    /**
     * 批量删除卡密
     * 接口: DELETE /api/card-codes/batch
     */
    async batchDeleteCardCodes(ids: number[]): Promise<void> {
        const response: ApiResponse<void> = await backendApi.delete('/card-codes/batch', { data: ids });
        if (response.code !== 200) {
            throw new Error(response.message || '批量删除卡密失败');
        }
    },

    /**
     * 清理过期卡密
     * 接口: POST /api/card-codes/clean-expired
     */
    async cleanExpiredCardCodes(): Promise<number> {
        const response: ApiResponse<number> = await backendApi.post('/card-codes/clean-expired');
        if (response.code !== 200) {
            throw new Error(response.message || '清理过期卡密失败');
        }
        return response.data!;
    },

    // ==================== 充值管理 ====================

    /**
     * 使用卡密充值
     * 接口: POST /api/recharge/card
     */
    async rechargeWithCard(data: CardRechargeRequest): Promise<AdminUser> {
        const response: ApiResponse<AdminUser> = await backendApi.post('/recharge/card', data);
        if (response.code !== 200) {
            throw new Error(response.message || '卡密充值失败');
        }
        return response.data!;
    },

    /**
     * 管理员充值
     * 接口: POST /api/recharge/admin
     */
    async adminRecharge(data: AdminRechargeRequest): Promise<AdminUser> {
        const { userId, amount, description } = data;
        const params = new URLSearchParams();
        params.append('userId', userId.toString());
        params.append('amount', amount.toString());
        if (description) {
            params.append('description', description);
        }

        const response: ApiResponse<AdminUser> = await backendApi.post(`/recharge/admin?${params.toString()}`);
        if (response.code !== 200) {
            throw new Error(response.message || '管理员充值失败');
        }
        return response.data!;
    },

    /**
     * 获取当前用户充值记录
     * 接口: GET /api/recharge/records
     */
    async getCurrentUserRechargeRecords(): Promise<RechargeRecord[]> {
        const response: ApiResponse<RechargeRecord[]> = await backendApi.get('/recharge/records');
        if (response.code !== 200) {
            throw new Error(response.message || '获取充值记录失败');
        }
        return response.data || [];
    },

    /**
     * 获取指定用户充值记录
     * 接口: GET /api/recharge/records/{userId}
     */
    async getUserRechargeRecords(userId: number): Promise<RechargeRecord[]> {
        const response: ApiResponse<RechargeRecord[]> = await backendApi.get(`/recharge/records/${userId}`);
        if (response.code !== 200) {
            throw new Error(response.message || '获取用户充值记录失败');
        }
        return response.data || [];
    },

    /**
     * 获取所有充值记录
     * 接口: GET /api/recharge/records/all
     */
    async getAllRechargeRecords(): Promise<RechargeRecord[]> {
        const response: ApiResponse<RechargeRecord[]> = await backendApi.get('/recharge/records/all');
        if (response.code !== 200) {
            throw new Error(response.message || '获取所有充值记录失败');
        }
        return response.data || [];
    },

    /**
     * 分页获取充值记录
     * 接口: GET /api/recharge/records/page
     */
    async getRechargeRecordsPage(pageNum = 1, pageSize = 10): Promise<PageResponse<RechargeRecord>> {
        const response: ApiResponse<PageResponse<RechargeRecord>> = await backendApi.get(`/recharge/records/page?pageNum=${pageNum}&pageSize=${pageSize}`);
        if (response.code !== 200) {
            throw new Error(response.message || '获取充值记录分页列表失败');
        }
        return response.data!;
    },

    /**
     * 获取充值记录列表（支持搜索和分页）
     * 这是一个适配函数，用于管理后台的充值管理页面
     */
    async getRechargeRecords(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        type?: string;
    } = {}): Promise<{ records: AdminRechargeRecord[]; total: number }> {
        const { page = 1, pageSize = 10, search, type } = params;

        // 获取所有充值记录
        const allRecords = await this.getAllRechargeRecords();

        // 转换为 AdminRechargeRecord 格式
        const adminRecords: AdminRechargeRecord[] = allRecords.map(record => ({
            ...record,
            adminId: record.type === 'admin' ? 1 : undefined, // 这里可能需要根据实际情况调整
            adminName: record.type === 'admin' ? 'admin' : undefined
        }));

        // 应用过滤条件
        let filteredRecords = adminRecords;

        if (search) {
            filteredRecords = filteredRecords.filter(record =>
                record.username.toLowerCase().includes(search.toLowerCase()) ||
                (record.description && record.description.toLowerCase().includes(search.toLowerCase()))
            );
        }

        if (type && type !== 'all') {
            filteredRecords = filteredRecords.filter(record => record.type === type);
        }

        // 手动分页
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const records = filteredRecords.slice(startIndex, endIndex);

        return {
            records,
            total: filteredRecords.length
        };
    },



    /**
     * 删除充值记录
     * 注意：这个功能可能需要后端额外实现
     */
    async deleteRechargeRecord(id: number): Promise<void> {
        // 这里可能需要实现删除充值记录的API
        // 目前先抛出错误提示
        throw new Error('删除充值记录功能暂未实现');
    },

    // ==================== 系统管理 ====================

    /**
     * 健康检查
     * 接口: GET /api/health
     */
    async healthCheck(): Promise<{ status: string; message: string }> {
        try {
            const response: ApiResponse<any> = await backendApi.get('/health');
            return {
                status: response.code === 200 ? 'healthy' : 'unhealthy',
                message: response.message || '系统运行正常'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: '系统连接失败'
            };
        }
    },

    /**
     * 获取仪表板统计数据
     * 注意：这个接口可能需要后端额外实现，目前使用组合API获取数据
     */
    async getDashboardStats(): Promise<DashboardStats> {
        try {
            // 并行获取各种数据，如果某个接口失败就返回空数组
            const [users, emails, cardCodes, rechargeRecords] = await Promise.all([
                this.getAllUsers().catch((error) => {
                    console.warn('Failed to fetch users for dashboard:', error);
                    return [];
                }),
                this.getAllEmails().catch((error) => {
                    console.warn('Failed to fetch emails for dashboard:', error);
                    return [];
                }),
                this.getAllCardCodes().catch((error) => {
                    console.warn('Failed to fetch card codes for dashboard:', error);
                    return [];
                }),
                this.getAllRechargeRecords().catch((error) => {
                    console.warn('Failed to fetch recharge records for dashboard:', error);
                    return [];
                })
            ]);

            // 计算统计数据
            const totalUsers = users.length;
            const totalEmails = emails.length;
            const totalAdmins = users.filter(u => u.permissions === 'admin').length;
            const totalActiveUsers = users.filter(u => u.frequency > 0).length;
            const totalCardCodes = cardCodes.length;
            const totalRechargeRecords = rechargeRecords.length;

            // 最近的数据（按创建时间排序）
            const recentUsers = users
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);

            const recentEmails = emails
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);

            const recentCardCodes = cardCodes
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);

            const recentRechargeRecords = rechargeRecords
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);

            // 增长数据
            const userGrowth = generateGrowthData(users.map(u => u.createdAt));
            const emailGrowth = generateGrowthData(emails.map(e => e.createdAt));
            const rechargeGrowth = generateGrowthData(rechargeRecords.map(r => r.createdAt));

            return {
                totalUsers,
                totalEmails,
                totalAdmins,
                totalActiveUsers,
                totalCardCodes,
                totalRechargeRecords,
                recentUsers,
                recentEmails,
                recentCardCodes,
                recentRechargeRecords,
                userGrowth,
                emailGrowth,
                rechargeGrowth
            };
        } catch (error) {
            console.error('获取仪表板数据失败:', error);
            throw new Error('获取仪表板数据失败');
        }
    },

    /**
     * 获取系统配置
     * 接口: GET /api/system/config
     */
    async getSystemConfig(): Promise<AdminSystemConfig> {
        try {
            console.log('获取系统配置...');
            const response: ApiResponse<AdminSystemConfig> = await backendApi.get('/system/config');

            if (response.code !== 200) {
                console.warn('后端未实现系统配置接口，使用默认配置');
                // 如果后端未实现，返回默认配置
                return {
                    siteName: 'Cloudflare 邮件路由管理系统',
                    siteDescription: '专业的邮件转发服务管理平台',
                    defaultQuota: 10,
                    maxQuota: 100,
                    allowRegistration: true,
                    emailNotification: true,
                    maintenanceMode: false,
                    apiRateLimit: 100,
                    sessionTimeout: 24
                };
            }

            return response.data!;
        } catch (error) {
            console.warn('获取系统配置失败，使用默认配置:', error);
            // 如果API调用失败，返回默认配置
            return {
                siteName: 'Cloudflare 邮件路由管理系统',
                siteDescription: '专业的邮件转发服务管理平台',
                defaultQuota: 10,
                maxQuota: 100,
                allowRegistration: true,
                emailNotification: true,
                maintenanceMode: false,
                apiRateLimit: 100,
                sessionTimeout: 24
            };
        }
    },

    /**
     * 更新系统配置
     * 接口: PUT /api/system/config
     */
    async updateSystemConfig(config: AdminSystemConfig): Promise<AdminSystemConfig> {
        try {
            console.log('更新系统配置:', config);

            const response: ApiResponse<AdminSystemConfig> = await backendApi.put('/system/config', config);

            if (response.code !== 200) {
                throw new Error(response.message || '更新系统配置失败');
            }

            console.log('系统配置更新成功');
            return response.data!;
        } catch (error: any) {
            console.error('更新系统配置失败:', error);

            // 如果后端未实现此接口，提供友好的错误信息
            if (error.response?.status === 404) {
                throw new Error('后端暂未实现系统配置保存功能，请联系管理员');
            }

            throw new Error(error.message || '更新系统配置失败');
        }
    },

    /**
     * 重置系统配置
     * 接口: POST /api/system/config/reset
     */
    async resetSystemConfig(): Promise<AdminSystemConfig> {
        try {
            console.log('重置系统配置...');

            const response: ApiResponse<AdminSystemConfig> = await backendApi.post('/system/config/reset');

            if (response.code !== 200) {
                throw new Error(response.message || '重置系统配置失败');
            }

            console.log('系统配置重置成功');
            return response.data!;
        } catch (error: any) {
            console.error('重置系统配置失败:', error);

            // 如果后端未实现此接口，返回默认配置
            if (error.response?.status === 404) {
                console.warn('后端未实现重置接口，返回默认配置');
                return this.getSystemConfig();
            }

            throw new Error(error.message || '重置系统配置失败');
        }
    },

    /**
     * 获取系统状态
     * 注意：这个接口可能需要后端额外实现，目前返回模拟数据
     */
    async getSystemStatus(): Promise<AdminSystemStatus> {
        // 这里应该调用真实的API获取系统状态
        // 目前返回模拟数据
        const users = await this.getAllUsers().catch(() => []);
        return {
            uptime: '15天 8小时 32分钟',
            cpuUsage: Math.floor(Math.random() * 30) + 30, // 30-60%
            memoryUsage: Math.floor(Math.random() * 20) + 50, // 50-70%
            diskUsage: Math.floor(Math.random() * 20) + 30, // 30-50%
            activeUsers: users.filter(u => u.frequency > 0).length,
            totalRequests: Math.floor(Math.random() * 10000) + 20000,
            errorRate: Math.random() * 0.05 // 0-5%
        };
    },

    /**
     * 更新卡密状态
     * 这是一个适配函数，用于卡密管理页面
     */
    async updateCardCode(id: number, data: { status: string }): Promise<AdminCardCode> {
        if (data.status === 'disabled') {
            const cardCode = await this.disableCardCode(id);
            return {
                ...cardCode,
                usedBy: cardCode.usedByUsername
            };
        } else if (data.status === 'active' || data.status === 'unused') {
            const cardCode = await this.enableCardCode(id);
            return {
                ...cardCode,
                usedBy: cardCode.usedByUsername
            };
        } else {
            throw new Error('不支持的卡密状态');
        }
    },


};

/**
 * 生成增长数据（辅助函数）
 */
function generateGrowthData(dates: string[]): Array<{ date: string; count: number }> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
        date,
        count: dates.filter(d => d.startsWith(date)).length
    }));
}
