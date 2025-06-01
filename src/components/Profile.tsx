import React, { useState, useEffect } from 'react';
import {
    Card,
    Descriptions,
    Typography,
    Space,
    Button,
    Spin,
    Alert,
    Tag,
    Row,
    Col,
    Statistic,
    Modal,
    Form,
    Input,
    message,
    Table,
    Tabs
} from 'antd';
import {
    UserOutlined,
    MailOutlined,
    CrownOutlined,
    ApiOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    ArrowLeftOutlined,
    CreditCardOutlined,
    DollarOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService, type CardRechargeRequest, type RechargeRecord } from '../services/userService';
import type { User } from '../types/auth';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // 充值相关状态
    const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
    const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([]);
    const [rechargeLoading, setRechargeLoading] = useState(false);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchUserInfo = async () => {
        try {
            setError('');
            const userData = await authService.getUserInfo();
            setUser(userData);
        } catch (err: any) {
            console.error('Failed to fetch user info:', err);
            setError(err.message || '获取用户信息失败');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchUserInfo();
    };

    const getPermissionColor = (permission: string) => {
        return permission === 'admin' ? 'gold' : 'blue';
    };

    const getPermissionIcon = (permission: string) => {
        return permission === 'admin' ? <CrownOutlined /> : <UserOutlined />;
    };

    // 获取充值记录
    const fetchRechargeRecords = async () => {
        setRecordsLoading(true);
        try {
            const records = await userService.getRechargeRecords();
            setRechargeRecords(records);
            console.log('Fetched recharge records:', records.length);
        } catch (error: any) {
            console.error('Failed to fetch recharge records:', error);
            // 只有在真正的错误情况下才显示错误消息
            // 如果是没有数据的情况，userService已经返回空数组了
            if (!error.message.includes('没有找到') && !error.message.includes('无数据')) {
                message.error(error.message || '获取充值记录失败');
            }
            // 即使出错也设置为空数组，避免界面异常
            setRechargeRecords([]);
        } finally {
            setRecordsLoading(false);
        }
    };

    // 卡密充值
    const handleRecharge = async (values: CardRechargeRequest) => {
        setRechargeLoading(true);
        try {
            const updatedUser = await userService.rechargeWithCard(values);
            message.success('充值成功！');
            setUser(updatedUser);
            setRechargeModalVisible(false);
            form.resetFields();
            // 刷新充值记录
            fetchRechargeRecords();
        } catch (error: any) {
            message.error(error.message || '充值失败');
        } finally {
            setRechargeLoading(false);
        }
    };

    // 初始化时获取充值记录
    useEffect(() => {
        if (user) {
            fetchRechargeRecords();
        }
    }, [user]);



    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
            }}>
                <Spin size="large" tip="加载用户信息中..." />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '24px' }}>
                <Alert
                    message="错误"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Space>
                            <Button size="small" onClick={handleRefresh}>
                                重试
                            </Button>
                            <Button size="small" onClick={() => navigate('/')}>
                                返回首页
                            </Button>
                        </Space>
                    }
                />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f5f5',
            padding: '16px',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            {/* 固定的页面头部 */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: '#f5f5f5',
                paddingBottom: '16px',
                marginBottom: '16px',
                borderBottom: '1px solid #e8e8e8'
            }}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/')}
                            type="primary"
                            ghost
                        >
                            返回首页
                        </Button>
                        <Title level={3} style={{ margin: 0 }}>
                            个人信息
                        </Title>
                    </Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={refreshing}
                        type="text"
                    >
                        刷新
                    </Button>
                </Space>
            </div>

            <Row gutter={[16, 16]}>
                {/* 基本信息卡片 */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <UserOutlined />
                                基本信息
                            </Space>
                        }
                        size="small"
                        style={{ height: '100%' }}
                    >
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="用户ID">
                                <Text code style={{ fontSize: '12px' }}>{user?.id}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="用户名">
                                <Space>
                                    <UserOutlined style={{ fontSize: '12px' }} />
                                    <Text strong style={{ fontSize: '14px' }}>{user?.username}</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="邮箱">
                                <Space>
                                    <MailOutlined style={{ fontSize: '12px' }} />
                                    <Text style={{ fontSize: '13px' }}>{user?.email}</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="权限等级">
                                <Tag
                                    color={getPermissionColor(user?.permissions || 'user')}
                                    icon={getPermissionIcon(user?.permissions || 'user')}
                                >
                                    {user?.permissions === 'admin' ? '管理员' : '普通用户'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="剩余配额">
                                <Text style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                    {user?.frequency || 0} 次
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                {/* 使用统计卡片 */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <ApiOutlined />
                                配额管理
                            </Space>
                        }
                        size="small"
                        style={{ height: '100%' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            {/* 剩余配额显示 */}
                            <div style={{ textAlign: 'center' }}>
                                <Statistic
                                    title="剩余配额"
                                    value={user?.frequency || 0}
                                    prefix={<ClockCircleOutlined />}
                                    valueStyle={{
                                        color: (user?.frequency || 0) > 3 ? '#3f8600' :
                                               (user?.frequency || 0) > 0 ? '#faad14' : '#cf1322',
                                        fontSize: '24px'
                                    }}
                                    suffix="次"
                                />
                                <div style={{ marginTop: '8px' }}>
                                    {(user?.frequency || 0) > 3 && (
                                        <Text type="success" style={{ fontSize: '12px' }}>配额充足</Text>
                                    )}
                                    {(user?.frequency || 0) > 0 && (user?.frequency || 0) <= 3 && (
                                        <Text style={{ color: '#faad14', fontSize: '12px' }}>配额不足</Text>
                                    )}
                                    {(user?.frequency || 0) === 0 && (
                                        <Text type="danger" style={{ fontSize: '12px' }}>配额已用完</Text>
                                    )}
                                </div>
                            </div>

                            {/* 充值按钮 */}
                            <div style={{ textAlign: 'center', margin: '12px 0' }}>
                                <Button
                                    type="primary"
                                    icon={<CreditCardOutlined />}
                                    onClick={() => setRechargeModalVisible(true)}
                                >
                                    卡密充值
                                </Button>
                            </div>

                            {/* 配额说明 */}
                            <div style={{
                                padding: '8px',
                                background: '#f6f8fa',
                                borderRadius: '6px',
                                border: '1px solid #e1e4e8'
                            }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    💡 每次创建邮件转发消耗1个配额
                                </Text>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* 充值记录 */}
            <Card
                title={
                    <Space>
                        <HistoryOutlined />
                        充值记录
                    </Space>
                }
                style={{ marginTop: '16px' }}
                size="small"
                extra={
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchRechargeRecords}
                        loading={recordsLoading}
                        size="small"
                        type="text"
                    >
                        刷新
                    </Button>
                }
            >
                <Table
                    dataSource={rechargeRecords}
                    loading={recordsLoading}
                    rowKey="id"
                    size="small"
                    scroll={{ x: 800 }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                <DollarOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                                <div style={{ color: '#999', fontSize: '14px' }}>暂无充值记录</div>
                                <div style={{ color: '#ccc', fontSize: '12px', marginTop: '4px' }}>
                                    使用卡密充值后记录将显示在这里
                                </div>
                            </div>
                        )
                    }}
                    pagination={{
                        pageSize: 3,
                        showSizeChanger: false,
                        showQuickJumper: false,
                        simple: true,
                    }}
                    columns={[
                        {
                            title: '类型',
                            dataIndex: 'type',
                            key: 'type',
                            width: 80,
                            render: (type: string) => (
                                <Tag color={type === 'card' ? 'blue' : 'green'}>
                                    {type === 'card' ? '卡密' : '管理员'}
                                </Tag>
                            ),
                        },
                        {
                            title: '金额',
                            dataIndex: 'amount',
                            key: 'amount',
                            width: 70,
                            render: (amount: number) => (
                                <Text style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '12px' }}>
                                    +{amount}
                                </Text>
                            ),
                        },
                        {
                            title: '前/后',
                            key: 'balance',
                            width: 80,
                            render: (_, record: RechargeRecord) => (
                                <Text style={{ fontSize: '12px' }}>
                                    {record.beforeBalance}→{record.afterBalance}
                                </Text>
                            ),
                        },
                        {
                            title: '描述',
                            dataIndex: 'description',
                            key: 'description',
                            ellipsis: true,
                            render: (text: string) => (
                                <Text style={{ fontSize: '12px' }}>{text}</Text>
                            ),
                        },
                        {
                            title: '时间',
                            dataIndex: 'createdAt',
                            key: 'createdAt',
                            width: 120,
                            render: (createdAt: string) => (
                                <Text style={{ fontSize: '12px' }}>
                                    {new Date(createdAt).toLocaleDateString()}
                                </Text>
                            ),
                        },
                    ]}
                />
            </Card>

            {/* 权限说明 - 可折叠 */}
            <Card
                title="权限说明"
                style={{ marginTop: '16px' }}
                size="small"
            >
                <Row gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                        <Space direction="vertical" size="small">
                            <Text strong style={{ fontSize: '14px' }}>
                                <CrownOutlined style={{ color: '#faad14' }} /> 管理员权限
                            </Text>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                                <li>管理所有用户邮件转发</li>
                                <li>管理用户配额和卡密</li>
                                <li>查看系统统计</li>
                            </ul>
                        </Space>
                    </Col>
                    <Col xs={24} md={12}>
                        <Space direction="vertical" size="small">
                            <Text strong style={{ fontSize: '14px' }}>
                                <UserOutlined style={{ color: '#1890ff' }} /> 普通用户权限
                            </Text>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                                <li>创建和查看自己的邮件转发</li>
                                <li>使用卡密充值配额</li>
                                <li>查看个人配额状态</li>
                            </ul>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* 浮动返回按钮 */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
            }}>
                <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/')}
                    style={{
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        width: '50px',
                        height: '50px',
                    }}
                    title="返回首页"
                />
            </div>

            {/* 卡密充值模态框 */}
            <Modal
                title={
                    <Space>
                        <CreditCardOutlined />
                        卡密充值
                    </Space>
                }
                open={rechargeModalVisible}
                onCancel={() => {
                    setRechargeModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleRecharge}
                >
                    <Form.Item
                        name="code"
                        label="卡密"
                        rules={[
                            { required: true, message: '请输入卡密' },
                            { min: 8, message: '卡密长度至少8位' }
                        ]}
                    >
                        <Input
                            placeholder="请输入卡密"
                            style={{ fontFamily: 'monospace' }}
                            autoComplete="off"
                        />
                    </Form.Item>

                    <div style={{
                        padding: '8px',
                        background: '#f6f8fa',
                        borderRadius: '4px',
                        marginBottom: '12px'
                    }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            💡 请输入有效的卡密进行充值，充值成功后配额将立即到账
                        </Text>
                    </div>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={rechargeLoading}
                                icon={<DollarOutlined />}
                            >
                                确认充值
                            </Button>
                            <Button
                                onClick={() => {
                                    setRechargeModalVisible(false);
                                    form.resetFields();
                                }}
                            >
                                取消
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Profile;
