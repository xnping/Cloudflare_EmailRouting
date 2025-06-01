import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ModernAdminLayout.css';
import '../styles/modern-admin.css';

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '仪表板', icon: '📊', path: '/admin/dashboard' },
  { key: 'users', label: '用户管理', icon: '👥', path: '/admin/users' },
  { key: 'emails', label: '邮件管理', icon: '📧', path: '/admin/emails' },
  { key: 'card-codes', label: '卡密管理', icon: '🎫', path: '/admin/card-codes' },
  { key: 'recharge', label: '充值管理', icon: '💰', path: '/admin/recharge' },
  { key: 'settings', label: '系统设置', icon: '⚙️', path: '/admin/settings' },
];

interface ModernAdminLayoutProps {
  children: React.ReactNode;
}

const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();

  // 监听窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuClick = (path: string) => {
    navigate(path);
    // 在移动端点击菜单项后关闭侧边栏
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  };

  const handleLogout = () => {
    // 清除所有认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('rememberMe');

    console.log('管理员退出登录');

    // 重定向到登录页面
    navigate('/login');
  };

  const handleBackToFrontend = () => {
    console.log('返回前台');
    // 直接跳转到前台首页
    navigate('/');
  };

  return (
    <div className="modern-admin-layout">
      {/* 侧边栏 */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            {!sidebarCollapsed && <span className="logo-text">管理后台</span>}
          </div>
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="back-to-frontend-btn" onClick={handleBackToFrontend}>
            <span className="nav-icon">🏠</span>
            {!sidebarCollapsed && <span className="nav-label">返回前台</span>}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {!sidebarCollapsed && <span className="nav-label">退出登录</span>}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="main-content">
        {/* 顶部导航栏 */}
        <header className="top-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              ☰
            </button>
            <h1 className="page-title">Cloudflare 邮件路由管理系统</h1>
          </div>
          <div className="header-right">
            <button className="header-back-btn" onClick={handleBackToFrontend} title="返回前台">
              <span className="btn-icon">🏠</span>
              <span className="btn-text">返回前台</span>
            </button>
            <div className="user-info">
              <span className="user-avatar">👤</span>
              <span className="user-name">管理员</span>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ModernAdminLayout;
