import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert, Divider, Checkbox, Tooltip, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, CloudOutlined, InfoCircleOutlined, GiftOutlined, TeamOutlined, QrcodeOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const { Title, Text } = Typography;

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);


    // 添加键盘快捷键支持和全屏设置
    useEffect(() => {
        // 设置body类名以启用认证页面样式
        document.body.classList.add('auth-page');

        // 初始化保存的用户名和记住我状态
        const savedUsername = authService.getSavedUsername();
        const savedPassword = authService.getSavedPassword();
        const rememberMe = authService.getRememberMe();
        const rememberPassword = authService.isPasswordRemembered();

        if (savedUsername && rememberMe) {
            const formValues: any = {
                username: savedUsername,
                remember: true
            };

            if (savedPassword && rememberPassword) {
                formValues.password = savedPassword;
                formValues.rememberPassword = true;
            }

            form.setFieldsValue(formValues);
        }

        const handleKeyPress = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Enter 快速登录
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                form.submit();
            }
            // Esc 清除错误信息
            if (e.key === 'Escape' && error) {
                setError('');
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        // 清理函数
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
            document.body.classList.remove('auth-page');
        };
    }, [form, error]);

    const handleSubmit = async (values: { username: string; password: string; remember?: boolean; rememberPassword?: boolean }) => {
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({
                username: values.username,
                password: values.password,
                remember: values.remember || false,
                rememberPassword: values.rememberPassword || false
            });
            if (response && response.token) {
                navigate('/', { replace: true });
            } else {
                setError('登录失败：未收到有效的认证信息');
            }
        } catch (err: any) {
            setError(err.message || '登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="auth-background"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                minHeight: '100vh'
            }}
        >
            <Row gutter={[40, 24]} style={{ width: '100%', maxWidth: 1400, alignItems: 'stretch' }}>
                {/* 左侧配额说明 */}
                <Col xs={24} lg={12}>
                    <Card
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 20,
                            border: 'none',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                        styles={{
                            body: {
                                padding: '40px 35px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }
                        }}
                    >
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            {/* 标题 */}
                            <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '80px' }}>
                                <GiftOutlined
                                    style={{
                                        fontSize: 48,
                                        color: '#fff',
                                        marginBottom: 16
                                    }}
                                />
                                <Title level={3} style={{ color: '#fff', margin: 0 }}>
                                    免费配额领取
                                </Title>
                            </div>

                            {/* 配额说明 */}
                            <Card
                                style={{
                                    borderRadius: 15,
                                    border: 'none',
                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                    backdropFilter: 'blur(10px)'
                                }}
                                styles={{ body: { padding: '24px' } }}
                            >
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong style={{ color: '#667eea', fontSize: '16px' }}>
                                        🎁 新用户福利
                                    </Text>
                                </div>
                                <div style={{ lineHeight: '1.8', marginBottom: 20 }}>
                                    <div style={{ marginBottom: 8 }}>
                                        <Text>• 注册即可获得免费邮件转发配额</Text>
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                        <Text>• 支持多个邮箱地址转发</Text>
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                        <Text>• 稳定可靠的 Cloudflare 服务</Text>
                                    </div>
                                    <div>
                                        <Text>• 24小时技术支持</Text>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<TeamOutlined />}
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            borderRadius: 10,
                                            fontWeight: 600,
                                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                            width: '100%',
                                            height: 48
                                        }}
                                        onClick={() => {
                                            window.open('https://qm.qq.com/q/6xyXWiq7QI', '_blank');
                                        }}
                                    >
                                        加入QQ群领取配额
                                    </Button>
                                </div>
                            </Card>

                            {/* QQ群二维码 */}
                            <Card
                                style={{
                                    borderRadius: 15,
                                    border: 'none',
                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                    backdropFilter: 'blur(10px)'
                                }}
                                styles={{ body: { padding: '24px' } }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <QrcodeOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }} />
                                        <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                                            扫码加群
                                        </Text>
                                    </div>

                                    {/* 二维码图片 */}
                                    <div style={{ marginBottom: 16 }}>
                                        <img
                                            src="/images/qq-qrcode.png"
                                            alt="QQ群二维码"
                                            style={{
                                                width: '200px',
                                                height: '200px',
                                                borderRadius: 12,
                                                border: '2px solid #f0f0f0',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            onError={(e) => {
                                                // 如果图片加载失败，显示占位符
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const placeholder = target.nextElementSibling as HTMLElement;
                                                if (placeholder) {
                                                    placeholder.style.display = 'flex';
                                                }
                                            }}
                                        />
                                        {/* 占位符 */}
                                        <div
                                            style={{
                                                width: '200px',
                                                height: '200px',
                                                borderRadius: 12,
                                                border: '2px dashed #d9d9d9',
                                                display: 'none',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'column',
                                                backgroundColor: '#fafafa',
                                                margin: '0 auto'
                                            }}
                                        >
                                            <QrcodeOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 8 }} />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                请将二维码图片保存到<br/>
                                                public/images/qq-qrcode.png
                                            </Text>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: 16, color: '#262626' }}>
                                            大风车无限邮官方服务群
                                        </Text>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <Text type="secondary" style={{ fontSize: 14 }}>
                                            群号：1053615154
                                        </Text>
                                    </div>
                                    <div style={{ fontSize: 13, lineHeight: '1.6', color: '#666' }}>
                                        <div>• 配额申请与发放</div>
                                        <div>• 使用教程与技术支持</div>
                                        <div>• 问题反馈与建议</div>
                                    </div>
                                </div>
                            </Card>
                        </Space>
                    </Card>
                </Col>

                {/* 右侧登录表单 */}
                <Col xs={24} lg={12}>
                    <Card
                        className="auth-card"
                        style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 20,
                            border: 'none',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                        }}
                        styles={{ body: { padding: '40px 35px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}
                    >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Logo和标题 */}
                    <div style={{ textAlign: 'center' }}>
                        <CloudOutlined
                            className="auth-logo"
                            style={{
                                fontSize: 48,
                                color: '#667eea',
                                marginBottom: 16
                            }}
                        />
                        <Title level={2} className="auth-title" style={{ margin: 0 }}>
                            Cloudflare 邮件路由
                        </Title>
                        <Text type="secondary" style={{ fontSize: 16 }}>
                            登录您的账户
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                            💡 提示：按 Ctrl+Enter 快速登录
                        </Text>
                    </div>

                    {/* 错误提示 */}
                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            style={{ borderRadius: 8 }}
                        />
                    )}

                    {/* 登录表单 */}
                    <Form
                        form={form}
                        name="login"
                        onFinish={handleSubmit}
                        size="large"
                        style={{ width: '100%' }}
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: '请输入用户名!' }]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="请输入用户名"
                                style={{ borderRadius: 10, height: 52, fontSize: 16 }}
                                disabled={loading}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: '请输入密码!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="请输入密码"
                                style={{ borderRadius: 10, height: 52, fontSize: 16 }}
                                disabled={loading}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 8 }}>
                            <Form.Item
                                name="remember"
                                valuePropName="checked"
                                style={{ marginBottom: 0 }}
                            >
                                <Checkbox
                                    style={{
                                        fontSize: 15,
                                        color: '#6b7280'
                                    }}
                                    disabled={loading}
                                >
                                    记住我（下次自动填充用户名）
                                </Checkbox>
                            </Form.Item>
                        </Form.Item>

                        <Form.Item
                            name="rememberPassword"
                            valuePropName="checked"
                            style={{ marginBottom: 8 }}
                            dependencies={['remember']}
                        >
                            {({ getFieldValue }) => (
                                <Checkbox
                                    style={{
                                        fontSize: 15,
                                        color: '#6b7280'
                                    }}
                                    disabled={loading || !getFieldValue('remember')}
                                >
                                    <Space>
                                        记住密码（仅在本设备）
                                        <Tooltip title="密码将加密保存在本地，仅在当前设备有效。建议仅在个人设备上使用此功能。">
                                            <InfoCircleOutlined style={{ color: '#9ca3af' }} />
                                        </Tooltip>
                                    </Space>
                                </Checkbox>
                            )}
                        </Form.Item>

                        {/* 安全提示 */}
                        <Form.Item dependencies={['rememberPassword']} style={{ marginBottom: 24 }}>
                            {({ getFieldValue }) =>
                                getFieldValue('rememberPassword') && (
                                    <Alert
                                        message="安全提示"
                                        description="密码将以加密形式保存在本地。请确保这是您的个人设备，不要在公共或共享设备上使用此功能。"
                                        type="warning"
                                        showIcon
                                        style={{
                                            fontSize: 12,
                                            borderRadius: 8,
                                            marginTop: 8
                                        }}
                                    />
                                )
                            }
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<LoginOutlined />}
                                className="auth-button"
                                style={{
                                    width: '100%',
                                    height: 52,
                                    borderRadius: 10,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    fontSize: 17,
                                    fontWeight: 600,
                                    letterSpacing: '0.5px'
                                }}
                            >
                                {loading ? '登录中...' : '登录'}
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* 分割线 */}
                    <Divider style={{ margin: '16px 0' }}>
                        <Text type="secondary" style={{ fontSize: 14 }}>
                            或
                        </Text>
                    </Divider>

                        {/* 注册链接 */}
                        <div style={{ textAlign: 'center' }}>
                            <Text type="secondary">
                                还没有账户？{' '}
                                <Button
                                    type="link"
                                    style={{
                                        padding: 0,
                                        height: 'auto',
                                        color: '#667eea',
                                        fontWeight: 500
                                    }}
                                    onClick={() => navigate('/register')}
                                >
                                    立即注册
                                </Button>
                            </Text>
                        </div>
                    </Space>
                </Card>
            </Col>
        </Row>
        </div>
    );
};

export default Login;