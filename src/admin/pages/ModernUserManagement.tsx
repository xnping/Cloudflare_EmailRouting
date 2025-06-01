import React, { useState, useEffect } from 'react';
import { adminApi, type AdminUser } from '../services/adminApi';
import './ModernUserManagement.css';

const ModernUserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    permissions: 'user',
    frequency: 10
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: 0,
    username: '',
    email: '',
    password: '',
    permissions: 'user',
    frequency: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('开始加载用户数据...');
      const response = await adminApi.getUsers({
        page: currentPage,
        pageSize,
        search: searchTerm
      });
      console.log('用户数据加载成功:', response);
      setUsers(response.users);
      setTotal(response.total);
    } catch (err) {
      console.error('加载用户数据失败:', err);
      console.error('错误详情:', {
        message: err instanceof Error ? err.message : '未知错误',
        stack: err instanceof Error ? err.stack : undefined,
        response: err
      });
      setError(err instanceof Error ? err.message : '加载用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    // 先测试连接和权限，再加载数据
    const initializeData = async () => {
      try {
        console.log('=== 开始初始化管理后台 ===');

        // 1. 验证Token有效性
        const isTokenValid = await adminApi.validateTokenAndRelogin();
        if (!isTokenValid) {
          console.log('❌ Token无效，已重定向到登录页面');
          return;
        }
        console.log('✅ Token验证通过');

        // 2. 测试基本连接
        await adminApi.testConnection();
        console.log('✅ API连接测试通过');

        // 3. 测试管理员权限
        const hasAdminPermission = await adminApi.testAdminPermission();
        if (!hasAdminPermission) {
          setError('权限不足：Token中的用户ID在数据库中不存在，或用户不是管理员。请重新登录或使用有效的管理员账户。');

          // 提供重新登录按钮
          setTimeout(() => {
            if (window.confirm('检测到认证问题，是否重新登录？')) {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/login';
            }
          }, 2000);
          return;
        }
        console.log('✅ 管理员权限验证通过');

        // 4. 加载用户数据
        console.log('开始加载用户数据...');
        await loadUsers();
        console.log('✅ 用户数据加载完成');

      } catch (error) {
        console.error('❌ 初始化失败:', error);
        setError(error instanceof Error ? error.message : '初始化失败，请检查后端服务是否正常运行');
      }
    };

    initializeData();
  }, [currentPage, searchTerm]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadUsers();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };



  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除这个用户吗？')) return;

    try {
      setLoading(true);
      await adminApi.deleteUser(userId);
      await loadUsers(); // 重新加载数据
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error('删除用户失败:', err);
      alert(err instanceof Error ? err.message : '删除用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedUsers.length} 个用户吗？`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedUsers.map(id => adminApi.deleteUser(id)));
      await loadUsers(); // 重新加载数据
      setSelectedUsers([]);
    } catch (err) {
      console.error('批量删除用户失败:', err);
      alert(err instanceof Error ? err.message : '批量删除用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
    setCreateForm({
      username: '',
      email: '',
      password: '',
      permissions: 'user',
      frequency: 10
    });
  };

  const handleCreateSubmit = async () => {
    try {
      setLoading(true);
      await adminApi.createUser(createForm);
      alert('用户创建成功！');
      setShowCreateModal(false);
      await loadUsers(); // 重新加载数据
    } catch (err) {
      console.error('创建用户失败:', err);
      alert(err instanceof Error ? err.message : '创建用户失败');
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

  const handleEditUser = (user: AdminUser) => {
    setEditForm({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '', // 密码留空，表示不修改
      permissions: user.permissions,
      frequency: user.frequency
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      // 构建更新数据，如果密码为空则不包含密码字段
      const updateData: any = {
        username: editForm.username,
        email: editForm.email,
        permissions: editForm.permissions
      };

      if (editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      await adminApi.updateUser(editForm.id, updateData);

      // 如果频次有变化，单独更新频次
      if (editForm.frequency !== users.find(u => u.id === editForm.id)?.frequency) {
        await adminApi.updateUserFrequency({ userId: editForm.id, frequency: editForm.frequency });
      }

      alert('用户更新成功！');
      setShowEditModal(false);
      await loadUsers(); // 重新加载数据
    } catch (err) {
      console.error('更新用户失败:', err);
      alert(err instanceof Error ? err.message : '更新用户失败');
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



  const getPermissionBadge = (permission: string) => {
    return permission === 'admin' ? '👑 管理员' : '👤 普通用户';
  };

  const getStatusBadge = (frequency: number) => {
    if (frequency > 50) return { text: '活跃', class: 'status-active' };
    if (frequency > 0) return { text: '正常', class: 'status-normal' };
    return { text: '受限', class: 'status-limited' };
  };

  return (
    <div className="modern-user-management">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">👥 用户管理</h1>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleCreateUser}>
              ➕ 添加用户
            </button>
          </div>
        </div>
        <p className="page-subtitle">管理系统用户账户和权限</p>
      </div>

      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <button className="filter-btn active">全部</button>
            <button className="filter-btn">管理员</button>
            <button className="filter-btn">普通用户</button>
          </div>
        </div>
        <div className="toolbar-right">
          {selectedUsers.length > 0 && (
            <button className="btn btn-danger" onClick={handleBatchDelete}>
              🗑️ 删除选中 ({selectedUsers.length})
            </button>
          )}
          <button className="btn btn-secondary" onClick={loadUsers} disabled={loading}>
            🔄 {loading ? '加载中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* 错误状态 */}
      {error && (
        <div className="error-container">
          <h3>❌ 加载失败</h3>
          <p>{error}</p>
          <button onClick={loadUsers} className="retry-btn">
            🔄 重试
          </button>
        </div>
      )}

      {/* 用户表格 */}
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                  className="checkbox"
                />
              </th>
              <th>用户信息</th>
              <th>权限</th>
              <th>配额状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="loading-cell">
                  <div className="loading-spinner">🔄 加载中...</div>
                </td>
              </tr>
            )}
            {!loading && users.map((user) => {
              const status = getStatusBadge(user.frequency);
              return (
                <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.permissions === 'admin' ? '👑' : '👤'}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.username}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`permission-badge ${user.permissions}`}>
                      {getPermissionBadge(user.permissions)}
                    </span>
                  </td>
                  <td>
                    <div className="quota-info">
                      <span className={`status-badge ${status.class}`}>
                        {status.text}
                      </span>
                      <div className="quota-value">剩余: {user.frequency}</div>
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditUser(user)}
                        title="编辑用户"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteUser(user.id)}
                        title="删除用户"
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

        {!loading && users.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">没有找到用户</div>
            <div className="empty-description">
              {searchTerm ? '尝试调整搜索条件' : '还没有用户数据'}
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

      {/* 创建用户模态框 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ 添加用户</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => handleCreateFormChange('username', e.target.value)}
                  placeholder="请输入用户名"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>邮箱</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => handleCreateFormChange('email', e.target.value)}
                  placeholder="请输入邮箱地址"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => handleCreateFormChange('password', e.target.value)}
                  placeholder="请输入密码"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>权限</label>
                <select
                  value={createForm.permissions}
                  onChange={(e) => handleCreateFormChange('permissions', e.target.value)}
                  className="form-select"
                >
                  <option value="user">👤 普通用户</option>
                  <option value="admin">👑 管理员</option>
                </select>
              </div>
              <div className="form-group">
                <label>初始配额</label>
                <input
                  type="number"
                  value={createForm.frequency}
                  onChange={(e) => handleCreateFormChange('frequency', parseInt(e.target.value) || 0)}
                  placeholder="请输入初始配额"
                  className="form-input"
                  min="0"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateSubmit} disabled={loading}>
                {loading ? '创建中...' : '创建用户'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑用户模态框 */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ 编辑用户</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => handleEditFormChange('username', e.target.value)}
                  placeholder="请输入用户名"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleEditFormChange('email', e.target.value)}
                  placeholder="请输入邮箱地址"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>密码（留空表示不修改）</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => handleEditFormChange('password', e.target.value)}
                  placeholder="请输入新密码（可选）"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>权限</label>
                <select
                  value={editForm.permissions}
                  onChange={(e) => handleEditFormChange('permissions', e.target.value)}
                  className="form-select"
                >
                  <option value="user">👤 普通用户</option>
                  <option value="admin">👑 管理员</option>
                </select>
              </div>
              <div className="form-group">
                <label>配额</label>
                <input
                  type="number"
                  value={editForm.frequency}
                  onChange={(e) => handleEditFormChange('frequency', parseInt(e.target.value) || 0)}
                  placeholder="请输入配额"
                  className="form-input"
                  min="0"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleEditSubmit} disabled={loading}>
                {loading ? '更新中...' : '更新用户'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernUserManagement;
