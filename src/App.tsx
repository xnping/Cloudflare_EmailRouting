import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Profile from './components/Profile';
import AdminApp from './admin';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          {/* 后台管理路由 */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute>
                <AdminApp />
              </PrivateRoute>
            }
          />
          {/* 将所有未匹配的路由重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
