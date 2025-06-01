import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, UserAddOutlined, CloudOutlined, MailOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const { Title, Text } = Typography;

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 设置全屏和键盘快捷键
    useEffect(() => {
        // 设置body类名以启用认证页面样式
        document.body.classList.add('auth-page');

        const handleKeyPress = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Enter 快速注册
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

    const handleSubmit = async (values: {
        username: string;
        password: string;
        confirmPassword: string;
        email: string;
    }) => {
        setError('');
        setLoading(true);

        try {
            const response = await authService.register({
                username: values.username,
                password: values.password,
                email: values.email,
                permissions: 'user' // 统一默认为普通用户
            });

            // 显示注册成功提示
            message.success({
                content: (
                    <div>
                        <div>🎉 注册成功！</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            已自动为您创建邮件转发地址，请检查邮箱验证邮件
                        </div>
                    </div>
                ),
                duration: 4,
            });

            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
                navigate('/'); // 注册成功后跳转到首页
            }, 1500);
        } catch (err: any) {
            setError(err.message || '注册失败，请稍后重试');
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
                justifyContent: 'center'
            }}
        >
            <Card
                className="auth-card"
                style={{
                    width: '100%',
                    maxWidth: 450,
                    borderRadius: 20,
                    border: 'none'
                }}
                bodyStyle={{ padding: '50px 40px' }}
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
                            创建新账户
                        </Title>
                        <Text type="secondary" style={{ fontSize: 16 }}>
                            加入 Cloudflare 邮件路由
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                            💡 提示：按 Ctrl+Enter 快速注册 | 默认注册为普通用户
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block', color: '#52c41a' }}>
                            📧 注册邮箱将自动设置为邮件转发目标地址
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

                    {/* 注册表单 */}
                    <Form
                        form={form}
                        name="register"
                        onFinish={handleSubmit}
                        size="large"
                        style={{ width: '100%' }}
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                { required: true, message: '请输入用户名!' },
                                { min: 3, message: '用户名至少3个字符!' }
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="请输入用户名（至少3个字符）"
                                style={{ borderRadius: 10, height: 52, fontSize: 16 }}
                                disabled={loading}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: '请输入密码!' },
                                { min: 6, message: '密码至少6个字符!' }
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="请输入密码（至少6个字符）"
                                style={{ borderRadius: 10, height: 52, fontSize: 16 }}
                                disabled={loading}
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: '请确认密码!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('两次输入的密码不一致!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="请再次输入密码"
                                style={{ borderRadius: 10, height: 52, fontSize: 16 }}
                                disabled={loading}
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: '请输入邮箱地址!' },
                                { type: 'email', message: '请输入有效的邮箱地址!' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="请输入邮箱地址"
                                style={{ borderRadius: 10, height: 52, fontSize: 16 }}
                                disabled={loading}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<UserAddOutlined />}
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
                                {loading ? '注册中...' : '注册'}
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* 分割线 */}
                    <Divider style={{ margin: '16px 0' }}>
                        <Text type="secondary" style={{ fontSize: 14 }}>
                            或
                        </Text>
                    </Divider>

                    {/* 登录链接 */}
                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">
                            已有账户？{' '}
                            <Button
                                type="link"
                                style={{
                                    padding: 0,
                                    height: 'auto',
                                    color: '#667eea',
                                    fontWeight: 500
                                }}
                                onClick={() => navigate('/login')}
                            >
                                立即登录
                            </Button>
                        </Text>
                    </div>
                </Space>
            </Card>
        </div>
    );
};

export default Register;