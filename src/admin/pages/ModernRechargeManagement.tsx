import React, { useState, useEffect } from 'react';
import { adminApi, type AdminRechargeRecord } from '../services/adminApi';
import './ModernRechargeManagement.css';

const ModernRechargeManagement: React.FC = () => {
  const [rechargeRecords, setRechargeRecords] = useState<AdminRechargeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  // const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeForm, setRechargeForm] = useState({
    userId: '',
    username: '',
    amount: 0,
    description: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 加载充值记录数据
  const loadRechargeRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getRechargeRecords({
        page: currentPage,
        pageSize,
        search: searchTerm,
        type: filterType === 'all' ? undefined : filterType
      });
      setRechargeRecords(response.records);
      setTotal(response.total);
    } catch (err) {
      console.error('加载充值记录失败:', err);
      setError(err instanceof Error ? err.message : '加载充值记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadRechargeRecords();
  }, [currentPage, filterType]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadRechargeRecords();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectRecord = (recordId: number) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === rechargeRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(rechargeRecords.map(record => record.id));
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('确定要删除这条充值记录吗？')) return;

    try {
      setLoading(true);
      await adminApi.deleteRechargeRecord(recordId);
      await loadRechargeRecords(); // 重新加载数据
      setSelectedRecords(prev => prev.filter(id => id !== recordId));
    } catch (err) {
      console.error('删除充值记录失败:', err);
      alert(err instanceof Error ? err.message : '删除充值记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRecords.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedRecords.length} 条充值记录吗？`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedRecords.map(id => adminApi.deleteRechargeRecord(id)));
      await loadRechargeRecords(); // 重新加载数据
      setSelectedRecords([]);
    } catch (err) {
      console.error('批量删除充值记录失败:', err);
      alert(err instanceof Error ? err.message : '批量删除充值记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRecharge = () => {
    setShowRechargeModal(true);
    setRechargeForm({
      userId: '',
      username: '',
      amount: 0,
      description: ''
    });
  };

  const handleRechargeSubmit = async () => {
    try {
      setLoading(true);
      await adminApi.adminRecharge({
        userId: parseInt(rechargeForm.userId),
        amount: rechargeForm.amount,
        description: rechargeForm.description
      });
      alert(`成功为用户 ${rechargeForm.username} 充值 ${rechargeForm.amount} 次！`);
      setShowRechargeModal(false);
      await loadRechargeRecords(); // 重新加载数据
    } catch (err) {
      console.error('管理员充值失败:', err);
      alert(err instanceof Error ? err.message : '管理员充值失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRechargeFormChange = (field: string, value: any) => {
    setRechargeForm(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'card':
        return { text: '卡密充值', class: 'type-card', icon: '🎫' };
      case 'admin':
        return { text: '管理员充值', class: 'type-admin', icon: '👑' };
      default:
        return { text: '未知', class: 'type-unknown', icon: '❓' };
    }
  };

  const getStats = () => {
    const cardRecharges = rechargeRecords.filter(r => r.type === 'card').length;
    const adminRecharges = rechargeRecords.filter(r => r.type === 'admin').length;
    const totalAmount = rechargeRecords.reduce((sum, r) => sum + r.amount, 0);
    const todayRecords = rechargeRecords.filter(r =>
      new Date(r.createdAt).toDateString() === new Date().toDateString()
    ).length;

    return { total, cardRecharges, adminRecharges, totalAmount, todayRecords };
  };

  const stats = getStats();

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="modern-recharge-management">
        <div className="error-container">
          <h2>❌ 加载失败</h2>
          <p>{error}</p>
          <button onClick={loadRechargeRecords} className="retry-btn">
            🔄 重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-recharge-management">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">💰 充值管理</h1>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleAdminRecharge}>
              ➕ 管理员充值
            </button>
          </div>
        </div>
        <p className="page-subtitle">管理用户充值记录和管理员充值操作</p>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-title">总充值记录</h3>
            <div className="stat-value">{total}</div>
            <div className="stat-trend">
              <span className="trend positive">+{Math.floor(total * 0.1)}</span>
              <span className="trend-label">本月新增</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-content">
            <h3 className="stat-title">总充值金额</h3>
            <div className="stat-value">{stats.totalAmount}</div>
            <div className="stat-trend">
              <span className="trend positive">+15%</span>
              <span className="trend-label">较上月</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <h3 className="stat-title">卡密充值</h3>
            <div className="stat-value">{stats.cardRecharges}</div>
            <div className="stat-trend">
              <span className="trend neutral">{total > 0 ? ((stats.cardRecharges / total) * 100).toFixed(1) : 0}%</span>
              <span className="trend-label">占比</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <h3 className="stat-title">管理员充值</h3>
            <div className="stat-value">{stats.adminRecharges}</div>
            <div className="stat-trend">
              <span className="trend neutral">{total > 0 ? ((stats.adminRecharges / total) * 100).toFixed(1) : 0}%</span>
              <span className="trend-label">占比</span>
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
              placeholder="搜索用户名或充值描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              全部
            </button>
            <button
              className={`filter-btn ${filterType === 'card' ? 'active' : ''}`}
              onClick={() => setFilterType('card')}
            >
              卡密充值
            </button>
            <button
              className={`filter-btn ${filterType === 'admin' ? 'active' : ''}`}
              onClick={() => setFilterType('admin')}
            >
              管理员充值
            </button>
          </div>
        </div>
        <div className="toolbar-right">
          {selectedRecords.length > 0 && (
            <button className="btn btn-danger" onClick={handleBatchDelete}>
              🗑️ 删除选中 ({selectedRecords.length})
            </button>
          )}
          <button className="btn btn-secondary" onClick={loadRechargeRecords} disabled={loading}>
            🔄 {loading ? '加载中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* 充值记录表格 */}
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedRecords.length === rechargeRecords.length && rechargeRecords.length > 0}
                  onChange={handleSelectAll}
                  className="checkbox"
                />
              </th>
              <th>用户信息</th>
              <th>充值金额</th>
              <th>充值类型</th>
              <th>充值描述</th>
              <th>操作员</th>
              <th>充值时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="loading-cell">
                  <div className="loading-spinner">🔄 加载中...</div>
                </td>
              </tr>
            )}
            {!loading && rechargeRecords.map((record) => {
              const typeBadge = getTypeBadge(record.type);
              return (
                <tr key={record.id} className={selectedRecords.includes(record.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRecords.includes(record.id)}
                      onChange={() => handleSelectRecord(record.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">👤</div>
                      <div className="user-details">
                        <div className="user-name">{record.username}</div>
                        <div className="user-id">ID: {record.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="amount-info">
                      <span className="amount-value">+{record.amount}</span>
                      <span className="amount-unit">次</span>
                    </div>
                  </td>
                  <td>
                    <span className={`type-badge ${typeBadge.class}`}>
                      {typeBadge.icon} {typeBadge.text}
                    </span>
                  </td>
                  <td>
                    <div className="description-info">
                      {record.description || '-'}
                    </div>
                  </td>
                  <td>
                    {record.type === 'admin' && record.adminName ? (
                      <div className="admin-info">
                        <div className="admin-name">👑 {record.adminName}</div>
                        <div className="admin-id">ID: {record.adminId}</div>
                      </div>
                    ) : (
                      <span className="system-auto">🤖 系统自动</span>
                    )}
                  </td>
                  <td>
                    <div className="date-info">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteRecord(record.id)}
                        title="删除充值记录"
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

        {!loading && rechargeRecords.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <div className="empty-title">没有找到充值记录</div>
            <div className="empty-description">
              {searchTerm ? '尝试调整搜索条件' : '还没有充值记录'}
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

      {/* 管理员充值模态框 */}
      {showRechargeModal && (
        <div className="modal-overlay" onClick={() => setShowRechargeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 管理员充值</h3>
              <button className="modal-close" onClick={() => setShowRechargeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>用户ID</label>
                <input
                  type="number"
                  value={rechargeForm.userId}
                  onChange={(e) => handleRechargeFormChange('userId', e.target.value)}
                  placeholder="请输入用户ID"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  value={rechargeForm.username}
                  onChange={(e) => handleRechargeFormChange('username', e.target.value)}
                  placeholder="请输入用户名"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>充值次数</label>
                <input
                  type="number"
                  value={rechargeForm.amount}
                  onChange={(e) => handleRechargeFormChange('amount', parseInt(e.target.value) || 0)}
                  placeholder="请输入充值次数"
                  className="form-input"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>充值说明</label>
                <textarea
                  value={rechargeForm.description}
                  onChange={(e) => handleRechargeFormChange('description', e.target.value)}
                  placeholder="请输入充值说明"
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRechargeModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleRechargeSubmit} disabled={loading}>
                {loading ? '充值中...' : `充值 ${rechargeForm.amount} 次`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernRechargeManagement;
