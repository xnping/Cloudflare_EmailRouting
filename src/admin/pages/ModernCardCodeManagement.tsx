import React, { useState, useEffect } from 'react';
import { adminApi, type AdminCardCode } from '../services/adminApi';
import './ModernCardCodeManagement.css';

const ModernCardCodeManagement: React.FC = () => {
  const [cardCodes, setCardCodes] = useState<AdminCardCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    count: 1,
    value: 10,
    expiresAt: '',
    description: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 加载卡密数据
  const loadCardCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getCardCodes({
        page: currentPage,
        pageSize,
        search: searchTerm,
        status: filterStatus === 'all' ? undefined : filterStatus
      });
      setCardCodes(response.cardCodes);
      setTotal(response.total);
    } catch (err) {
      console.error('加载卡密数据失败:', err);
      setError(err instanceof Error ? err.message : '加载卡密数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadCardCodes();
  }, [currentPage, filterStatus]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadCardCodes();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectCode = (codeId: number) => {
    setSelectedCodes(prev =>
      prev.includes(codeId)
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCodes.length === cardCodes.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(cardCodes.map(code => code.id));
    }
  };

  const handleDisableCode = async (codeId: number) => {
    if (!confirm('确定要禁用这个卡密吗？')) return;

    try {
      setLoading(true);
      await adminApi.updateCardCode(codeId, { status: 'disabled' });
      await loadCardCodes(); // 重新加载数据
    } catch (err) {
      console.error('禁用卡密失败:', err);
      alert(err instanceof Error ? err.message : '禁用卡密失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async (codeId: number) => {
    if (!confirm('确定要删除这个卡密吗？')) return;

    try {
      setLoading(true);
      await adminApi.deleteCardCode(codeId);
      await loadCardCodes(); // 重新加载数据
      setSelectedCodes(prev => prev.filter(id => id !== codeId));
    } catch (err) {
      console.error('删除卡密失败:', err);
      alert(err instanceof Error ? err.message : '删除卡密失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedCodes.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedCodes.length} 个卡密吗？`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedCodes.map(id => adminApi.deleteCardCode(id)));
      await loadCardCodes(); // 重新加载数据
      setSelectedCodes([]);
    } catch (err) {
      console.error('批量删除卡密失败:', err);
      alert(err instanceof Error ? err.message : '批量删除卡密失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCards = () => {
    setShowGenerateModal(true);
    setGenerateForm({
      count: 1,
      value: 10,
      expiresAt: '',
      description: ''
    });
  };

  const handleGenerateSubmit = async () => {
    try {
      setLoading(true);
      await adminApi.generateCardCodesForAdmin(generateForm);
      alert(`成功生成 ${generateForm.count} 个卡密！`);
      setShowGenerateModal(false);
      await loadCardCodes(); // 重新加载数据
    } catch (err) {
      console.error('生成卡密失败:', err);
      alert(err instanceof Error ? err.message : '生成卡密失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFormChange = (field: string, value: any) => {
    setGenerateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unused':
      case 'active':
        return { text: '可用', class: 'status-active', icon: '✅' };
      case 'used':
        return { text: '已使用', class: 'status-used', icon: '✔️' };
      case 'disabled':
        return { text: '已禁用', class: 'status-disabled', icon: '❌' };
      default:
        return { text: '未知', class: 'status-unknown', icon: '❓' };
    }
  };

  const getStats = () => {
    const active = cardCodes.filter(c => c.status === 'unused' || c.status === 'active').length;
    const used = cardCodes.filter(c => c.status === 'used').length;
    const disabled = cardCodes.filter(c => c.status === 'disabled').length;
    const totalValue = cardCodes.filter(c => c.status === 'unused' || c.status === 'active').reduce((sum, c) => sum + c.value, 0);

    return { total, active, used, disabled, totalValue };
  };

  const stats = getStats();

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="modern-cardcode-management">
        <div className="error-container">
          <h2>❌ 加载失败</h2>
          <p>{error}</p>
          <button onClick={loadCardCodes} className="retry-btn">
            🔄 重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-cardcode-management">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">🎫 卡密管理</h1>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleGenerateCards}>
              ➕ 生成卡密
            </button>
          </div>
        </div>
        <p className="page-subtitle">管理系统卡密的生成、使用和状态</p>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-title">总卡密数</h3>
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
            <h3 className="stat-title">可用卡密</h3>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-trend">
              <span className="trend positive">{total > 0 ? ((stats.active / total) * 100).toFixed(1) : 0}%</span>
              <span className="trend-label">可用率</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✔️</div>
          <div className="stat-content">
            <h3 className="stat-title">已使用</h3>
            <div className="stat-value">{stats.used}</div>
            <div className="stat-trend">
              <span className="trend neutral">{total > 0 ? ((stats.used / total) * 100).toFixed(1) : 0}%</span>
              <span className="trend-label">使用率</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-content">
            <h3 className="stat-title">总价值</h3>
            <div className="stat-value">{stats.totalValue}</div>
            <div className="stat-trend">
              <span className="trend positive">可用额度</span>
              <span className="trend-label">次数</span>
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
              placeholder="搜索卡密代码或使用者..."
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
              className={`filter-btn ${filterStatus === 'unused' ? 'active' : ''}`}
              onClick={() => setFilterStatus('unused')}
            >
              可用
            </button>
            <button
              className={`filter-btn ${filterStatus === 'used' ? 'active' : ''}`}
              onClick={() => setFilterStatus('used')}
            >
              已使用
            </button>
            <button
              className={`filter-btn ${filterStatus === 'disabled' ? 'active' : ''}`}
              onClick={() => setFilterStatus('disabled')}
            >
              已禁用
            </button>
          </div>
        </div>
        <div className="toolbar-right">
          {selectedCodes.length > 0 && (
            <button className="btn btn-danger" onClick={handleBatchDelete}>
              🗑️ 删除选中 ({selectedCodes.length})
            </button>
          )}
          <button className="btn btn-secondary" onClick={loadCardCodes} disabled={loading}>
            🔄 {loading ? '加载中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* 卡密表格 */}
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedCodes.length === cardCodes.length && cardCodes.length > 0}
                  onChange={handleSelectAll}
                  className="checkbox"
                />
              </th>
              <th>卡密代码</th>
              <th>价值</th>
              <th>状态</th>
              <th>使用信息</th>
              <th>创建时间</th>
              <th>过期时间</th>
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
            {!loading && cardCodes.map((code) => {
              const statusBadge = getStatusBadge(code.status);
              return (
                <tr key={code.id} className={selectedCodes.includes(code.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedCodes.includes(code.id)}
                      onChange={() => handleSelectCode(code.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>
                    <div className="card-code">
                      <span className="code-text">{code.code}</span>
                      <button
                        className="copy-btn"
                        onClick={() => navigator.clipboard.writeText(code.code)}
                        title="复制卡密"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="card-value">
                      <span className="value-number">{code.value}</span>
                      <span className="value-unit">次</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${statusBadge.class}`}>
                      {statusBadge.icon} {statusBadge.text}
                    </span>
                  </td>
                  <td>
                    {code.status === 'used' && code.usedBy ? (
                      <div className="usage-info">
                        <div className="used-by">用户: {code.usedBy}</div>
                        <div className="used-at">
                          {new Date(code.usedAt!).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    ) : (
                      <span className="no-usage">-</span>
                    )}
                  </td>
                  <td>
                    <div className="date-info">
                      {new Date(code.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('zh-CN') : '永久'}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {(code.status === 'unused' || code.status === 'active') && (
                        <button
                          className="action-btn disable"
                          onClick={() => handleDisableCode(code.id)}
                          title="禁用卡密"
                        >
                          🚫
                        </button>
                      )}
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteCode(code.id)}
                        title="删除卡密"
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

        {!loading && cardCodes.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">🎫</div>
            <div className="empty-title">没有找到卡密</div>
            <div className="empty-description">
              {searchTerm ? '尝试调整搜索条件' : '还没有生成卡密'}
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

      {/* 生成卡密模态框 */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎫 生成卡密</h3>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>生成数量</label>
                <input
                  type="number"
                  value={generateForm.count}
                  onChange={(e) => handleGenerateFormChange('count', parseInt(e.target.value) || 1)}
                  placeholder="请输入生成数量"
                  className="form-input"
                  min="1"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>卡密价值（次数）</label>
                <input
                  type="number"
                  value={generateForm.value}
                  onChange={(e) => handleGenerateFormChange('value', parseInt(e.target.value) || 0)}
                  placeholder="请输入卡密价值"
                  className="form-input"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>过期时间（可选）</label>
                <input
                  type="datetime-local"
                  value={generateForm.expiresAt}
                  onChange={(e) => handleGenerateFormChange('expiresAt', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>描述（可选）</label>
                <textarea
                  value={generateForm.description}
                  onChange={(e) => handleGenerateFormChange('description', e.target.value)}
                  placeholder="请输入卡密描述"
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleGenerateSubmit} disabled={loading}>
                {loading ? '生成中...' : `生成 ${generateForm.count} 个卡密`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCardCodeManagement;
