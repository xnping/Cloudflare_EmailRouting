import React, { useEffect, useState } from 'react';
import { Layout, Button, Typography, Space, Avatar, Dropdown } from 'antd';
import { LogoutOutlined, CloudOutlined, UserOutlined, SettingOutlined, CrownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EmailRouting from './EmailRouting';
import { authService } from '../services/authService';
import type { User } from '../types/auth';

const { Header, Content } = Layout;
const { Title } = Typography;

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);

    // 确保主页面也是全屏显示
    useEffect(() => {
        // 移除认证页面的类名，确保主页面正常显示
        document.body.classList.remove('auth-page');

        // 获取当前用户信息
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        // 清理函数
        return () => {
            // 组件卸载时不需要特殊处理
        };
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleProfile = () => {
        navigate('/profile');
    };

    const handleAdmin = () => {
        navigate('/admin');
    };

    // 检查是否为管理员
    const isAdmin = user?.permissions === 'admin';

    // 用户下拉菜单
    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: '个人信息',
            onClick: handleProfile,
        },
        ...(isAdmin ? [{
            key: 'admin',
            icon: <CrownOutlined />,
            label: '管理后台',
            onClick: handleAdmin,
        }] : []),
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout,
        },
    ];

    return (
        <Layout
            style={{
                minHeight: '100vh',
                height: '100vh',
                width: '100vw',
                background: '#f5f5f5',
                margin: 0,
                padding: 0,
                position: 'fixed',
                top: 0,
                left: 0,
                overflow: 'hidden'
            }}
        >
            <Header
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                <Space align="center">
                    <CloudOutlined style={{ fontSize: 24, color: 'white' }} />
                    <Title level={3} style={{ margin: 0, color: 'white' }}>
                        Cloudflare 邮件路由管理
                    </Title>
                </Space>
                <Space align="center">
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Button
                            type="text"
                            style={{
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '6px',
                                padding: '4px 12px',
                                height: 'auto'
                            }}
                        >
                            <Space>
                                <Avatar
                                    size="small"
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                                />
                                <span>{user?.username || '用户'}</span>
                                <SettingOutlined />
                            </Space>
                        </Button>
                    </Dropdown>
                </Space>
            </Header>
            <Content
                style={{
                    padding: '24px',
                    background: '#f5f5f5',
                    overflow: 'auto',
                    height: 'calc(100vh - 64px)' // 减去Header的高度
                }}
            >
                <EmailRouting />
            </Content>
        </Layout>
    );
};

export default Home;