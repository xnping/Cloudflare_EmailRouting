import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { adminApi, type AdminSystemConfig, type AdminSystemStatus } from '../services/adminApi';
import './ModernSystemSettings.css';

const ModernSystemSettings: React.FC = () => {
  const [config, setConfig] = useState<AdminSystemConfig>({
    siteName: 'Cloudflare 邮件路由管理系统',
    siteDescription: '专业的邮件转发服务管理平台',
    defaultQuota: 10,
    maxQuota: 100,
    allowRegistration: true,
    emailNotification: true,
    maintenanceMode: false,
    apiRateLimit: 100,
    sessionTimeout: 24
  });

  const [systemStatus, setSystemStatus] = useState<AdminSystemStatus>({
    uptime: '0天 0小时 0分钟',
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    activeUsers: 0,
    totalRequests: 0,
    errorRate: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // 加载系统配置
  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const [configData, statusData] = await Promise.all([
        adminApi.getSystemConfig(),
        adminApi.getSystemStatus()
      ]);
      setConfig(configData);
      setSystemStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadSystemConfig();
  }, []);

  const handleConfigChange = (key: keyof AdminSystemConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updatedConfig = await adminApi.updateSystemConfig(config);
      setConfig(updatedConfig);

      message.success('设置保存成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存设置失败';

      if (errorMessage.includes('后端暂未实现')) {
        message.warning(errorMessage + ' - 配置已在前端临时保存，但需要后端支持才能永久保存。');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('⚠️ 确定要重置所有设置吗？\n\n这将恢复所有配置到默认值，此操作不可撤销！')) return;

    try {
      setSaving(true);

      const resetConfig = await adminApi.resetSystemConfig();
      setConfig(resetConfig);

      message.success('设置重置成功！所有配置已恢复到默认值。');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重置设置失败';

      if (errorMessage.includes('后端未实现')) {
        // 如果后端未实现，手动重置到默认配置
        const defaultConfig = {
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
        setConfig(defaultConfig);
        message.warning('后端未实现重置接口，已在前端重置到默认配置。');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'general', label: '基本设置', icon: '⚙️' },
    { key: 'quota', label: '配额设置', icon: '📊' },
    { key: 'security', label: '安全设置', icon: '🔒' },
    { key: 'system', label: '系统状态', icon: '📈' }
  ];

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="modern-system-settings">
        <div className="error-container">
          <h2>❌ 加载失败</h2>
          <p>{error}</p>
          <button onClick={loadSystemConfig} className="retry-btn">
            🔄 重试
          </button>
        </div>
      </div>
    );
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="modern-system-settings">
        <div className="loading-container">
          <div className="loading-spinner">🔄 加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-system-settings">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">⚙️ 系统设置</h1>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={saving}
            >
              🔄 {saving ? '重置中...' : '重置设置'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '💾 保存设置'}
            </button>
          </div>
        </div>
        <p className="page-subtitle">配置系统参数和功能开关</p>
      </div>

      {/* 标签页导航 */}
      <div className="tabs-container">
        <div className="tabs-nav">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 标签页内容 */}
      <div className="tab-content">
        {/* 基本设置 */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <h2 className="section-title">🏠 基本设置</h2>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">网站名称</label>
                <input
                  type="text"
                  className="setting-input"
                  value={config.siteName}
                  onChange={(e) => handleConfigChange('siteName', e.target.value)}
                  placeholder="请输入网站名称"
                />
                <p className="setting-description">显示在页面标题和导航栏的网站名称</p>
              </div>

              <div className="setting-item">
                <label className="setting-label">网站描述</label>
                <textarea
                  className="setting-textarea"
                  value={config.siteDescription}
                  onChange={(e) => handleConfigChange('siteDescription', e.target.value)}
                  placeholder="请输入网站描述"
                  rows={3}
                />
                <p className="setting-description">网站的简短描述，用于SEO和页面介绍</p>
              </div>

              <div className="setting-item">
                <label className="setting-label">用户注册</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="allowRegistration"
                    checked={config.allowRegistration}
                    onChange={(e) => handleConfigChange('allowRegistration', e.target.checked)}
                  />
                  <label htmlFor="allowRegistration" className="toggle-label">
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-text">
                    {config.allowRegistration ? '允许新用户注册' : '禁止新用户注册'}
                  </span>
                </div>
                <p className="setting-description">控制是否允许新用户注册账户</p>
              </div>

              <div className="setting-item">
                <label className="setting-label">邮件通知</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="emailNotification"
                    checked={config.emailNotification}
                    onChange={(e) => handleConfigChange('emailNotification', e.target.checked)}
                  />
                  <label htmlFor="emailNotification" className="toggle-label">
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-text">
                    {config.emailNotification ? '启用邮件通知' : '禁用邮件通知'}
                  </span>
                </div>
                <p className="setting-description">系统事件和重要通知的邮件提醒</p>
              </div>
            </div>
          </div>
        )}

        {/* 配额设置 */}
        {activeTab === 'quota' && (
          <div className="settings-section">
            <h2 className="section-title">📊 配额设置</h2>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">默认配额</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="setting-input"
                    value={config.defaultQuota}
                    onChange={(e) => handleConfigChange('defaultQuota', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                  <span className="input-unit">次</span>
                </div>
                <p className="setting-description">新用户注册时的默认邮件转发配额</p>
              </div>

              <div className="setting-item">
                <label className="setting-label">最大配额</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="setting-input"
                    value={config.maxQuota}
                    onChange={(e) => handleConfigChange('maxQuota', parseInt(e.target.value))}
                    min="1"
                    max="10000"
                  />
                  <span className="input-unit">次</span>
                </div>
                <p className="setting-description">单个用户可拥有的最大邮件转发配额</p>
              </div>

              <div className="quota-preview">
                <h3 className="preview-title">配额预览</h3>
                <div className="preview-cards">
                  <div className="preview-card">
                    <div className="preview-icon">🆕</div>
                    <div className="preview-content">
                      <div className="preview-label">新用户配额</div>
                      <div className="preview-value">{config.defaultQuota} 次</div>
                    </div>
                  </div>
                  <div className="preview-card">
                    <div className="preview-icon">🔝</div>
                    <div className="preview-content">
                      <div className="preview-label">最大配额</div>
                      <div className="preview-value">{config.maxQuota} 次</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 安全设置 */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <h2 className="section-title">🔒 安全设置</h2>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">API请求限制</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="setting-input"
                    value={config.apiRateLimit}
                    onChange={(e) => handleConfigChange('apiRateLimit', parseInt(e.target.value))}
                    min="10"
                    max="1000"
                  />
                  <span className="input-unit">次/分钟</span>
                </div>
                <p className="setting-description">每个IP地址每分钟允许的API请求次数</p>
              </div>

              <div className="setting-item">
                <label className="setting-label">会话超时</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    className="setting-input"
                    value={config.sessionTimeout}
                    onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                    min="1"
                    max="168"
                  />
                  <span className="input-unit">小时</span>
                </div>
                <p className="setting-description">用户登录会话的有效期</p>
              </div>

              <div className="setting-item">
                <label className="setting-label">维护模式</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={config.maintenanceMode}
                    onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                  />
                  <label htmlFor="maintenanceMode" className="toggle-label">
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-text">
                    {config.maintenanceMode ? '维护模式已启用' : '维护模式已禁用'}
                  </span>
                </div>
                <p className="setting-description">启用后，普通用户将无法访问系统</p>
              </div>
            </div>
          </div>
        )}

        {/* 系统状态 */}
        {activeTab === 'system' && (
          <div className="settings-section">
            <h2 className="section-title">📈 系统状态</h2>
            <div className="status-grid">
              <div className="status-card">
                <div className="status-header">
                  <span className="status-icon">⏱️</span>
                  <span className="status-title">系统运行时间</span>
                </div>
                <div className="status-value">{systemStatus.uptime}</div>
              </div>

              <div className="status-card">
                <div className="status-header">
                  <span className="status-icon">👥</span>
                  <span className="status-title">活跃用户</span>
                </div>
                <div className="status-value">{systemStatus.activeUsers}</div>
              </div>

              <div className="status-card">
                <div className="status-header">
                  <span className="status-icon">📊</span>
                  <span className="status-title">总请求数</span>
                </div>
                <div className="status-value">{systemStatus.totalRequests.toLocaleString()}</div>
              </div>

              <div className="status-card">
                <div className="status-header">
                  <span className="status-icon">⚠️</span>
                  <span className="status-title">错误率</span>
                </div>
                <div className="status-value">{(systemStatus.errorRate * 100).toFixed(2)}%</div>
              </div>
            </div>

            <div className="performance-section">
              <h3 className="performance-title">系统性能</h3>
              <div className="performance-metrics">
                <div className="metric-item">
                  <div className="metric-header">
                    <span className="metric-label">CPU 使用率</span>
                    <span className="metric-value">{systemStatus.cpuUsage}%</span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-fill cpu"
                      style={{ width: `${systemStatus.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="metric-item">
                  <div className="metric-header">
                    <span className="metric-label">内存使用率</span>
                    <span className="metric-value">{systemStatus.memoryUsage}%</span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-fill memory"
                      style={{ width: `${systemStatus.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="metric-item">
                  <div className="metric-header">
                    <span className="metric-label">磁盘使用率</span>
                    <span className="metric-value">{systemStatus.diskUsage}%</span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-fill disk"
                      style={{ width: `${systemStatus.diskUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernSystemSettings;
