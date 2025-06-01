import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type DashboardStats } from '../services/adminApi';
import './ModernDashboard.css';

const ModernDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalEmails: 0,
    totalAdmins: 0,
    totalActiveUsers: 0,
    totalCardCodes: 0,
    totalRechargeRecords: 0,
    recentUsers: [],
    recentEmails: [],
    recentCardCodes: [],
    recentRechargeRecords: [],
    userGrowth: [],
    emailGrowth: [],
    rechargeGrowth: []
  });

  const statCards = [
    {
      title: '总用户数',
      value: stats.totalUsers,
      icon: '👥',
      color: '#3b82f6',
      trend: '+12%',
      path: '/admin/users'
    },
    {
      title: '邮件数量',
      value: stats.totalEmails,
      icon: '📧',
      color: '#10b981',
      trend: '+8%',
      path: '/admin/emails'
    },
    {
      title: '管理员',
      value: stats.totalAdmins,
      icon: '👑',
      color: '#f59e0b',
      trend: '0%',
      path: '/admin/users'
    },
    {
      title: '活跃用户',
      value: stats.totalActiveUsers,
      icon: '✨',
      color: '#8b5cf6',
      trend: '+15%',
      path: '/admin/users'
    },
    {
      title: '卡密数量',
      value: stats.totalCardCodes,
      icon: '🎫',
      color: '#ef4444',
      trend: '+5%',
      path: '/admin/card-codes'
    },
    {
      title: '充值记录',
      value: stats.totalRechargeRecords,
      icon: '💰',
      color: '#06b6d4',
      trend: '+22%',
      path: '/admin/recharge'
    },
  ];

  const quickActions = [
    { title: '添加用户', icon: '👤', action: () => navigate('/admin/users'), color: '#3b82f6' },
    { title: '邮件管理', icon: '📧', action: () => navigate('/admin/emails'), color: '#10b981' },
    { title: '生成卡密', icon: '🎫', action: () => navigate('/admin/card-codes'), color: '#f59e0b' },
    { title: '充值管理', icon: '💰', action: () => navigate('/admin/recharge'), color: '#8b5cf6' },
  ];

  // 加载仪表板数据
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await adminApi.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('加载仪表板数据失败:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadDashboardData();
  }, []);

  // 格式化时间
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
  };

  // 生成最近活动数据
  const recentActivities = [
    ...stats.recentUsers.slice(0, 2).map(user => ({
      type: 'user',
      message: `新用户 ${user.username} 注册`,
      time: formatTimeAgo(user.createdAt),
      icon: '👤'
    })),
    ...stats.recentEmails.slice(0, 2).map(email => ({
      type: 'email',
      message: `邮件转发 ${email.email} → ${email.toEmail}`,
      time: formatTimeAgo(email.createdAt),
      icon: '📧'
    })),
    ...stats.recentRechargeRecords.slice(0, 2).map(record => ({
      type: 'recharge',
      message: `用户 ${record.username} 充值 ${record.amount} 次`,
      time: formatTimeAgo(record.createdAt),
      icon: '💰'
    }))
  ].slice(0, 6);

  const handleRefresh = () => {
    loadDashboardData();
  };

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="modern-dashboard">
        <div className="error-container">
          <h2>❌ 加载失败</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            🔄 重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-dashboard">
      {/* 页面头部 */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">📊 仪表板概览</h1>
          <button
            className={`refresh-btn ${loading ? 'loading' : ''}`}
            onClick={handleRefresh}
            disabled={loading}
          >
            🔄 {loading ? '刷新中...' : '刷新数据'}
          </button>
        </div>
        <p className="dashboard-subtitle">欢迎回来！这里是您的管理后台概览</p>
      </div>

      {/* 统计卡片网格 */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="stat-card"
            onClick={() => navigate(card.path)}
            style={{ '--card-color': card.color } as React.CSSProperties}
          >
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <h3 className="stat-title">{card.title}</h3>
              <div className="stat-value">{card.value.toLocaleString()}</div>
              <div className="stat-trend">
                <span className={`trend ${card.trend.startsWith('+') ? 'positive' : 'neutral'}`}>
                  {card.trend}
                </span>
                <span className="trend-label">较上月</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="dashboard-content">
        {/* 快速操作 */}
        <div className="dashboard-section">
          <h2 className="section-title">🚀 快速操作</h2>
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="action-btn"
                onClick={action.action}
                style={{ '--action-color': action.color } as React.CSSProperties}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-title">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="dashboard-section">
          <h2 className="section-title">📋 最近活动</h2>
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 系统状态 */}
      <div className="dashboard-section">
        <h2 className="section-title">📊 系统状态</h2>
        <div className="system-status">
          <div className="status-item">
            <div className="status-indicator online"></div>
            <span>API 服务</span>
            <span className="status-label">正常</span>
          </div>
          <div className="status-item">
            <div className="status-indicator online"></div>
            <span>数据库</span>
            <span className="status-label">正常</span>
          </div>
          <div className="status-item">
            <div className="status-indicator warning"></div>
            <span>系统负载</span>
            <span className="status-label">中等</span>
          </div>
          <div className="status-item">
            <div className="status-indicator online"></div>
            <span>邮件服务</span>
            <span className="status-label">正常</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
