import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 从配置文件导入统一的 API 配置
// 注意：这里不能直接导入 config.ts，因为 vite.config.ts 在构建时运行
// 所以我们保持这里的配置，但确保与 config.ts 保持一致
const API_ENDPOINTS = {
  BACKEND: {
    DEVELOPMENT: 'http://45.204.6.32:5000',
    PROXY_PATH: '/api',
  },
  CLOUDFLARE: {
    BASE_URL: 'https://api.cloudflare.com/client/v4',
    PROXY_PATH: '/cloudflare-api',
  }
} as const;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      [API_ENDPOINTS.BACKEND.PROXY_PATH]: {
        target: API_ENDPOINTS.BACKEND.DEVELOPMENT,
        changeOrigin: true,
        secure: false,
      },
      [API_ENDPOINTS.CLOUDFLARE.PROXY_PATH]: {
        target: API_ENDPOINTS.CLOUDFLARE.BASE_URL,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(new RegExp(`^${API_ENDPOINTS.CLOUDFLARE.PROXY_PATH}`), ''),
      },
    },
  },
});
