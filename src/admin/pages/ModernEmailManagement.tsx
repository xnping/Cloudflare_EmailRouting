import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { adminApi, type AdminEmailRecord } from '../services/adminApi';
import './ModernEmailManagement.css';

const ModernEmailManagement: React.FC = () => {
  const [emails, setEmails] = useState<AdminEmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  // const [showModal, setShowModal] = useState(false);
  // const [editingEmail, setEditingEmail] = useState<AdminEmailRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: '',
    email: '',
    toEmail: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: 0,
    userId: '',
    email: '',
    toEmail: ''
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 加载邮件数据
  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getEmails({
        page: currentPage,
        pageSize,
        search: searchTerm,
        status: filterStatus === 'all' ? undefined : filterStatus
      });
      setEmails(response.emails);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载邮件数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadEmails();
  }, [currentPage, filterStatus]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadEmails();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectEmail = (emailId: number) => {
    setSelectedEmails(prev =>
      prev.includes(emailId)
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map(email => email.id));
    }
  };



  const handleDeleteEmail = async (emailId: number) => {
    if (!confirm('确定要删除这个邮件转发规则吗？')) return;

    try {
      setLoading(true);
      await adminApi.deleteEmail(emailId);
      await loadEmails(); // 重新加载数据
      setSelectedEmails(prev => prev.filter(id => id !== emailId));
    } catch (err) {
      console.error('删除邮件转发规则失败:', err);
      message.error(err instanceof Error ? err.message : '删除邮件转发规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedEmails.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedEmails.length} 个邮件转发规则吗？`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedEmails.map(id => adminApi.deleteEmail(id)));
      await loadEmails(); // 重新加载数据
      setSelectedEmails([]);
    } catch (err) {
      console.error('批量删除邮件转发规则失败:', err);
      message.error(err instanceof Error ? err.message : '批量删除邮件转发规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setShowCreateModal(true);
    setCreateForm({
      userId: '',
      email: '',
      toEmail: ''
    });
  };

  const handleCreateSubmit = async () => {
    try {
      setLoading(true);
      await adminApi.createEmailForAdmin(createForm);
      message.success('转发规则创建成功！');
      setShowCreateModal(false);
      await loadEmails(); // 重新加载数据
    } catch (err) {
      console.error('创建转发规则失败:', err);
      message.error(err instanceof Error ? err.message : '创建转发规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFormChange = (field: string, value: any) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditEmail = (email: AdminEmailRecord) => {
    setEditForm({
      id: email.id,
      userId: email.userId.toString(),
      email: email.email,
      toEmail: email.toEmail
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      await adminApi.updateEmail(editForm.id, {
        userId: parseInt(editForm.userId),
        email: editForm.email,
        toEmail: editForm.toEmail
      });
      message.success('邮件转发规则更新成功！');
      setShowEditModal(false);
      await loadEmails(); // 重新加载数据
    } catch (err) {
      console.error('更新邮件转发规则失败:', err);
      message.error(err instanceof Error ? err.message : '更新邮件转发规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getEmailStatus = (email: AdminEmailRecord) => {
    // 简单的状态判断逻辑
    const isRecent = new Date(email.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return isRecent ? 'active' : 'normal';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { text: '活跃', class: 'status-active' };
      case 'normal':
        return { text: '正常', class: 'status-normal' };
      default:
        return { text: '未知', class: 'status-unknown' };
    }
  };

  // 计算统计数据
  const activeEmails = emails.filter(e => getEmailStatus(e) === 'active').length;
  const uniqueUsers = new Set(emails.map(e => e.userId)).size;
  const todayForwards = Math.floor(total * 2.5); // 模拟今日转发数

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="modern-email-management">
        <div className="error-container">
          <h2>❌ 加载失败</h2>
          <p>{error}</p>
          <button onClick={loadEmails} className="retry-btn">
            🔄 重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-email-management">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">📧 邮件管理</h1>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleCreateRule}>
              ➕ 创建转发规则
            </button>
          </div>
        </div>
        <p className="page-subtitle">管理邮件转发规则和路由配置</p>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-title">总转发规则</h3>
            <div className="stat-value">{total}</div>
            <div className="stat-trend">
              <span className="trend positive">+{Math.floor(total * 0.1)}</span>
              <span className="trend-label">本月新增</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className="stat-title">活跃规则</h3>
            <div className="stat-value">{activeEmails}</div>
            <div className="stat-trend">
              <span className="trend positive">+15%</span>
              <span className="trend-label">较上周</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3 className="stat-title">关联用户</h3>
            <div className="stat-value">{uniqueUsers}</div>
            <div className="stat-trend">
              <span className="trend neutral">0%</span>
              <span className="trend-label">无变化</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3 className="stat-title">今日转发</h3>
            <div className="stat-value">{todayForwards}</div>
            <div className="stat-trend">
              <span className="trend positive">+8%</span>
              <span className="trend-label">较昨日</span>
            </div>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索邮箱地址或用户名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              全部
            </button>
            <button
              className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              活跃
            </button>
            <button
              className={`filter-btn ${filterStatus === 'normal' ? 'active' : ''}`}
              onClick={() => setFilterStatus('normal')}
            >
              正常
            </button>
          </div>
        </div>
        <div className="toolbar-right">
          {selectedEmails.length > 0 && (
            <button className="btn btn-danger" onClick={handleBatchDelete}>
              🗑️ 删除选中 ({selectedEmails.length})
            </button>
          )}
          <button className="btn btn-secondary" onClick={loadEmails} disabled={loading}>
            🔄 {loading ? '加载中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* 邮件表格 */}
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedEmails.length === emails.length && emails.length > 0}
                  onChange={handleSelectAll}
                  className="checkbox"
                />
              </th>
              <th>用户信息</th>
              <th>邮件转发</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="loading-cell">
                  <div className="loading-spinner">🔄 加载中...</div>
                </td>
              </tr>
            )}
            {!loading && emails.map((email) => {
              const status = getEmailStatus(email);
              const statusBadge = getStatusBadge(status);
              return (
                <tr key={email.id} className={selectedEmails.includes(email.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(email.id)}
                      onChange={() => handleSelectEmail(email.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">👤</div>
                      <div className="user-details">
                        <div className="user-name">{email.username}</div>
                        <div className="user-id">ID: {email.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="email-forward">
                      <div className="email-from">
                        <span className="email-label">从:</span>
                        <span className="email-address">{email.email}</span>
                      </div>
                      <div className="email-arrow">→</div>
                      <div className="email-to">
                        <span className="email-label">到:</span>
                        <span className="email-address">{email.toEmail}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${statusBadge.class}`}>
                      {statusBadge.text}
                    </span>
                  </td>
                  <td>
                    <div className="date-info">
                      {new Date(email.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      {new Date(email.updatedAt).toLocaleDateString('zh-CN')}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditEmail(email)}
                        title="编辑转发规则"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteEmail(email.id)}
                        title="删除转发规则"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading && emails.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">📧</div>
            <div className="empty-title">没有找到邮件转发规则</div>
            <div className="empty-description">
              {searchTerm ? '尝试调整搜索条件' : '还没有邮件转发规则'}
            </div>
          </div>
        )}
      </div>

      {/* 分页 */}
      <div className="pagination">
        <div className="pagination-info">
          显示 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, total)} 条，共 {total} 条记录
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            上一页
          </button>
          <button className="page-btn active">{currentPage}</button>
          <button
            className="page-btn"
            disabled={currentPage * pageSize >= total || loading}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            下一页
          </button>
        </div>
      </div>

      {/* 创建转发规则模态框 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ 创建转发规则</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>用户ID</label>
                <input
                  type="number"
                  value={createForm.userId}
                  onChange={(e) => handleCreateFormChange('userId', e.target.value)}
                  placeholder="请输入用户ID"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>源邮箱地址</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => handleCreateFormChange('email', e.target.value)}
                  placeholder="请输入源邮箱地址"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>目标邮箱地址</label>
                <input
                  type="email"
                  value={createForm.toEmail}
                  onChange={(e) => handleCreateFormChange('toEmail', e.target.value)}
                  placeholder="请输入目标邮箱地址"
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateSubmit} disabled={loading}>
                {loading ? '创建中...' : '创建规则'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑转发规则模态框 */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ 编辑转发规则</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>用户ID</label>
                <input
                  type="number"
                  value={editForm.userId}
                  onChange={(e) => handleEditFormChange('userId', e.target.value)}
                  placeholder="请输入用户ID"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>源邮箱地址</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleEditFormChange('email', e.target.value)}
                  placeholder="请输入源邮箱地址"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>目标邮箱地址</label>
                <input
                  type="email"
                  value={editForm.toEmail}
                  onChange={(e) => handleEditFormChange('toEmail', e.target.value)}
                  placeholder="请输入目标邮箱地址"
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleEditSubmit} disabled={loading}>
                {loading ? '更新中...' : '更新规则'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernEmailManagement;
