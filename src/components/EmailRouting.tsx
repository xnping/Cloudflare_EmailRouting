import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Alert, Space, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MailOutlined } from '@ant-design/icons';
import type { EmailDestination } from '../services/cloudflareApi';
import { cloudflareApi } from '../services/cloudflareApi';
import { CLOUDFLARE_CONFIG } from '../config';
import { authService } from '../services/authService';
import { emailService } from '../services/emailService';
import { userService } from '../services/userService';
import type { User } from '../types/auth';

const { Text } = Typography;

const EmailRouting: React.FC = () => {
    const [destinations, setDestinations] = useState<EmailDestination[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const fetchDestinations = async () => {
        try {
            setLoading(true);

            const cloudflareData = await cloudflareApi.getDestinations();

            if (!isAdmin && currentUser?.id) {
                try {
                    const userEmailRecords = await emailService.getUserEmailRecords(currentUser.id);
                    const userEmails = new Set(userEmailRecords.map(record => record.email));

                    const filteredData = cloudflareData.filter((destination: EmailDestination) => {
                        const destinationEmail = destination.matchers?.[0]?.value;
                        return destinationEmail && userEmails.has(destinationEmail);
                    });

                    setDestinations(Array.isArray(filteredData) ? filteredData : []);
                } catch (emailError: any) {
                    if (emailError.message?.includes('没有找到') || emailError.message?.includes('无数据')) {
                        setDestinations([]);
                    } else {
                        setDestinations(Array.isArray(cloudflareData) ? cloudflareData : []);
                    }
                }
            } else {
                setDestinations(Array.isArray(cloudflareData) ? cloudflareData : []);
            }
        } catch (error) {
            message.error('获取路由规则失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 获取当前用户信息
        const user = authService.getCurrentUser();
        setCurrentUser(user);
    }, []);

    // 检查用户是否为管理员
    const isAdmin = currentUser?.permissions === 'admin';

    // 当用户信息加载后，获取邮件转发列表
    useEffect(() => {
        if (currentUser) {
            fetchDestinations();
        }
    }, [currentUser, isAdmin]); // 依赖用户信息和管理员状态

    const handleAdd = () => {
        // 检查配额
        if (!userService.hasQuota(currentUser?.frequency || 0)) {
            message.error('配额不足，无法创建邮件转发');
            return;
        }

        form.resetFields();
        setEditingId(null);
        setModalVisible(true);
    };

    const handleEdit = (record: EmailDestination) => {
        // 检查权限
        if (!isAdmin) {
            message.error('只有管理员才能编辑邮件转发规则');
            return;
        }

        const customPrefix = record.matchers?.[0]?.value?.split('@')[0] || '';

        form.setFieldsValue({
            customPrefix
        });
        setEditingId(record.id!);
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        // 检查权限
        if (!isAdmin) {
            message.error('只有管理员才能删除邮件转发规则');
            return;
        }

        try {
            await cloudflareApi.deleteDestination(id);

            message.success('删除成功');
            fetchDestinations();
        } catch (error) {
            message.error('删除失败');
        }
    };

    const handleSubmit = async (values: { customPrefix: string }) => {
        if (!currentUser?.email || !currentUser?.id) {
            message.error('无法获取用户信息，请重新登录');
            return;
        }

        try {
            setLoading(true);
            const forwardTo = currentUser.email; // 自动使用当前用户的邮箱
            const customEmail = `${values.customPrefix}@${CLOUDFLARE_CONFIG.EMAIL_DOMAIN}`;

            if (editingId) {
                await cloudflareApi.updateDestination(editingId, values.customPrefix, forwardTo);
                message.success('更新成功');
            } else {
                if (!userService.hasQuota(currentUser.frequency || 0)) {
                    throw new Error('配额不足，无法创建邮件转发');
                }

                // let cloudflareCreated = false;
                // let databaseCreated = false;

                try {
                    await cloudflareApi.createDestination(values.customPrefix, forwardTo);

                    await emailService.createEmailRecord({
                        userId: currentUser.id,
                        email: customEmail,
                        toEmail: forwardTo
                    });

                    const updatedUser = await userService.consumeQuota(currentUser.id, currentUser.frequency || 0);

                    const updatedUserData = { ...currentUser, frequency: updatedUser.frequency };
                    setCurrentUser(updatedUserData);
                    localStorage.setItem('user', JSON.stringify(updatedUserData));

                    message.success(`创建成功！邮件将转发至：${forwardTo}，剩余配额：${updatedUser.frequency}`);

                } catch (error: any) {
                    throw error;
                }
            }

            setModalVisible(false);
            fetchDestinations();
        } catch (error: any) {
            message.error(error.message || (editingId ? '更新失败' : '创建失败'));
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: '自定义地址',
            key: 'customAddress',
            render: (_: any, record: EmailDestination) => (
                <span>{record.matchers?.[0]?.value || '-'}</span>
            ),
        },
        {
            title: '转发至',
            key: 'forwardTo',
            render: (_: any, record: EmailDestination) => (
                <span>{record.actions?.[0]?.value?.join(', ') || '-'}</span>
            ),
        },
        {
            title: '状态',
            key: 'status',
            render: (_: any, record: EmailDestination) => (
                <span>{record.enabled ? '启用' : '禁用'}</span>
            ),
        },
        {
            title: '创建时间',
            key: 'created',
            render: (_: any, record: EmailDestination) => (
                <span>{record.created ? new Date(record.created).toLocaleString() : '-'}</span>
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: EmailDestination) => (
                <Space>
                    {isAdmin && (
                        <>
                            <Button
                                type="link"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                                size="small"
                            >
                                编辑
                            </Button>
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(record.id!)}
                                size="small"
                            >
                                删除
                            </Button>
                        </>
                    )}
                    {!isAdmin && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            仅管理员可操作
                        </Text>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 功能说明 */}
            <Alert
                message="邮件转发说明"
                description={
                    <Space direction="vertical" size={4}>
                        <Text>
                            📧 创建自定义邮件地址，所有邮件将自动转发到您的注册邮箱：
                            <Text strong style={{ marginLeft: 4 }}>{currentUser?.email}</Text>
                        </Text>
                        <Text type="secondary">
                            例如：创建 "support" 前缀后，发送到 support@{CLOUDFLARE_CONFIG.EMAIL_DOMAIN} 的邮件将转发到您的邮箱
                        </Text>
                        <Text type="secondary">
                            👤 当前身份：
                            <Text strong style={{ marginLeft: 4, color: isAdmin ? '#52c41a' : '#1890ff' }}>
                                {isAdmin ? '管理员' : '普通用户'}
                            </Text>
                            {!isAdmin && <Text type="secondary"> （只能创建和查看自己的邮件转发，编辑和删除需要管理员权限）</Text>}
                            {isAdmin && <Text type="secondary"> （可以查看和管理所有用户的邮件转发）</Text>}
                        </Text>
                        <Text type="secondary">
                            📊 使用配额：
                            <Text
                                strong
                                style={{
                                    marginLeft: 4,
                                    color: userService.getQuotaStatusType(currentUser?.frequency || 0) === 'error' ? '#ff4d4f' :
                                           userService.getQuotaStatusType(currentUser?.frequency || 0) === 'warning' ? '#faad14' : '#52c41a'
                                }}
                            >
                                {userService.getQuotaStatus(currentUser?.frequency || 0)}
                            </Text>
                        </Text>
                    </Space>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: '16px' }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    size="large"
                    disabled={!userService.hasQuota(currentUser?.frequency || 0)}
                    style={{
                        height: '48px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        background: userService.hasQuota(currentUser?.frequency || 0)
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#f5f5f5',
                        border: 'none'
                    }}
                >
                    {userService.hasQuota(currentUser?.frequency || 0)
                        ? '创建邮件转发'
                        : '配额已用完'}
                </Button>
                {!userService.hasQuota(currentUser?.frequency || 0) && (
                    <Text type="secondary" style={{ marginLeft: 12, fontSize: '14px' }}>
                        配额不足，无法创建新的邮件转发
                    </Text>
                )}
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
                <Table
                    loading={loading}
                    columns={columns}
                    dataSource={destinations}
                    rowKey="id"
                    size="large"
                    style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                        size: 'default'
                    }}
                />
            </div>

            <Modal
                title={
                    editingId
                        ? `编辑邮件转发 ${!isAdmin ? '(需要管理员权限)' : ''}`
                        : '创建邮件转发'
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                confirmLoading={loading}
                width={600}
                style={{ top: 100 }}
                okText={editingId ? '更新' : '创建'}
                cancelText="取消"
                okButtonProps={{
                    style: {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        height: '36px',
                        fontWeight: 600
                    }
                }}
                cancelButtonProps={{
                    style: {
                        borderRadius: '6px',
                        height: '36px'
                    }
                }}
            >
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout="vertical"
                >
                    {/* 显示当前用户邮箱信息 */}
                    <Alert
                        message="转发目标"
                        description={
                            <Space>
                                <MailOutlined />
                                <Text strong>{currentUser?.email || '未获取到用户邮箱'}</Text>
                                <Text type="secondary">（自动使用您的注册邮箱）</Text>
                            </Space>
                        }
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Form.Item
                        name="customPrefix"
                        label="自定义地址前缀"
                        rules={[
                            { required: true, message: '请输入自定义地址前缀' },
                            { pattern: /^[a-zA-Z0-9-_.]+$/, message: '前缀只能包含字母、数字、连字符、下划线和点' }
                        ]}
                        extra={
                            <Space direction="vertical" size={4}>
                                <Text type="secondary">
                                    完整地址将是：<Text code>your-prefix@{CLOUDFLARE_CONFIG.EMAIL_DOMAIN}</Text>
                                </Text>
                                <Text type="secondary">
                                    邮件将自动转发至：<Text strong>{currentUser?.email}</Text>
                                </Text>
                            </Space>
                        }
                    >
                        <Input
                            placeholder="例如：support、info、contact"
                            size="large"
                            style={{ borderRadius: '8px', height: '48px' }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default EmailRouting;