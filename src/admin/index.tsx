import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ModernAdminLayout from './components/ModernAdminLayout';
import ModernDashboard from './pages/ModernDashboard';
import ModernUserManagement from './pages/ModernUserManagement';
import ModernEmailManagement from './pages/ModernEmailManagement';
import ModernCardCodeManagement from './pages/ModernCardCodeManagement';
import ModernRechargeManagement from './pages/ModernRechargeManagement';
import ModernSystemSettings from './pages/ModernSystemSettings';
import { authService } from '../services/authService';

const AdminApp: React.FC = () => {
    const user = authService.getCurrentUser();

    // 为管理后台添加特殊的CSS类
    React.useEffect(() => {
        document.getElementById('root')?.classList.add('admin-layout');
        document.body.classList.add('admin-page');
        return () => {
            document.getElementById('root')?.classList.remove('admin-layout');
            document.body.classList.remove('admin-page');
        };
    }, []);

    // 检查是否为管理员

    // 临时允许所有已登录用户访问管理后台（用于调试）
    if (!user) {

        return <Navigate to="/login" replace />;
    }

    // 如果不是管理员，显示警告但仍然允许访问（临时调试）
    if (user.permissions !== 'admin') {
        // Allow access for debugging
    }

    return (
        <ModernAdminLayout>
            <Routes>
                <Route index element={<ModernDashboard />} />
                <Route path="dashboard" element={<ModernDashboard />} />
                <Route path="users" element={<ModernUserManagement />} />
                <Route path="emails" element={<ModernEmailManagement />} />
                <Route path="card-codes" element={<ModernCardCodeManagement />} />
                <Route path="recharge" element={<ModernRechargeManagement />} />
                <Route path="settings" element={<ModernSystemSettings />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
        </ModernAdminLayout>
    );
};

export default AdminApp;
