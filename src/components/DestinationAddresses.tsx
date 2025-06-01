import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    message,
    Space,
    Tag,
    Tooltip,
    Card,
    Typography,
    Alert
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    MailOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import type { DestinationAddress } from '../services/cloudflareApi';
import { cloudflareApi } from '../services/cloudflareApi';
import { CLOUDFLARE_CONFIG } from '../config';

const { Title, Text } = Typography;

const DestinationAddresses: React.FC = () => {
    const [addresses, setAddresses] = useState<DestinationAddress[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    // 检查是否配置了Account ID
    const isAccountIdConfigured = !!(CLOUDFLARE_CONFIG.ACCOUNT_ID && CLOUDFLARE_CONFIG.ACCOUNT_ID !== '40fda975fc0eb67e944a9d215f2c1152');

    const fetchAddresses = async () => {
        if (!isAccountIdConfigured) {
            return;
        }

        try {
            setLoading(true);
            const data = await cloudflareApi.getDestinationAddresses();
            setAddresses(Array.isArray(data) ? data : []);
        } catch (error: any) {
            message.error(error.message || '获取目标地址失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [isAccountIdConfigured]);

    const handleCreate = () => {
        form.resetFields();
        setModalVisible(true);
    };

    const handleSubmit = async (values: { email: string }) => {
        try {
            setLoading(true);
            await cloudflareApi.createDestinationAddress(values.email);
            message.success('目标地址创建成功！请检查邮箱并点击验证链接。');
            setModalVisible(false);
            fetchAddresses();
        } catch (error: any) {
            message.error(error.message || '创建失败');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (addressId: string, email: string) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除目标地址 "${email}" 吗？`,
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    setLoading(true);
                    await cloudflareApi.deleteDestinationAddress(addressId);
                    message.success('删除成功');
                    fetchAddresses();
                } catch (error: any) {
                    message.error(error.message || '删除失败');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const getVerificationStatus = (address: DestinationAddress) => {
        if (address.verified) {
            return (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                    已验证
                </Tag>
            );
        } else {
            return (
                <Tag color="warning" icon={<ClockCircleOutlined />}>
                    待验证
                </Tag>
            );
        }
    };

    const columns = [
        {
            title: '邮箱地址',
            dataIndex: 'email',
            key: 'email',
            render: (email: string) => (
                <Space>
                    <MailOutlined />
                    <Text strong>{email}</Text>
                </Space>
            ),
        },
        {
            title: '验证状态',
            key: 'verified',
            render: (record: DestinationAddress) => getVerificationStatus(record),
        },
        {
            title: '创建时间',
            dataIndex: 'created',
            key: 'created',
            render: (created: string) => created ? new Date(created).toLocaleString('zh-CN') : '-',
        },
        {
            title: '验证时间',
            dataIndex: 'verified',
            key: 'verifiedTime',
            render: (verified: string) => verified ? new Date(verified).toLocaleString('zh-CN') : '-',
        },
        {
            title: '操作',
            key: 'actions',
            render: (record: DestinationAddress) => (
                <Space>
                    <Tooltip title="删除目标地址">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id!, record.email)}
                            disabled={loading}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    if (!isAccountIdConfigured) {
        return (
            <Card>
                <Alert
                    message="配置缺失"
                    description={
                        <div>
                            <p>目标地址管理功能需要配置Cloudflare Account ID。</p>
                            <p>请在 <Text code>src/config.ts</Text> 文件中配置 <Text code>ACCOUNT_ID</Text> 字段</p>
                            <p>
                                获取Account ID：
                                <a
                                    href="https://dash.cloudflare.com/profile"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ marginLeft: 8 }}
                                >
                                    Cloudflare Dashboard
                                </a>
                            </p>
                        </div>
                    }
                    type="warning"
                    icon={<ExclamationCircleOutlined />}
                    showIcon
                />
            </Card>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>目标地址管理</Title>
                    <Text type="secondary">管理邮件转发的目标地址，新地址需要验证后才能使用</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    disabled={loading}
                >
                    添加目标地址
                </Button>
            </div>

            {addresses.length === 0 && !loading && (
                <Alert
                    message="暂无目标地址"
                    description='点击"添加目标地址"按钮创建第一个目标地址'
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <Table
                columns={columns}
                dataSource={addresses}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个地址`,
                }}
            />

            <Modal
                title="添加目标地址"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="email"
                        label="邮箱地址"
                        rules={[
                            { required: true, message: '请输入邮箱地址' },
                            { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="请输入要添加的目标邮箱地址"
                            disabled={loading}
                        />
                    </Form.Item>

                    <Alert
                        message="验证提醒"
                        description="创建后，系统会向该邮箱发送验证邮件，请点击邮件中的链接完成验证。只有验证过的地址才能用于邮件转发。"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)} disabled={loading}>
                                取消
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                创建地址
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DestinationAddresses;
