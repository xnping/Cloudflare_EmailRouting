import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { message } from 'antd'
import './index.css'
import App from './App.tsx'

// 配置 message 全局设置
message.config({
  duration: 1, // 1秒后自动消失
  maxCount: 3, // 最多同时显示3个消息
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
