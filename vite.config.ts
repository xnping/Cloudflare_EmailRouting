import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Backend API proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Backend API request:', {
              method: proxyReq.method,
              path: proxyReq.path,
              headers: proxyReq.getHeaders()
            });
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Backend API response:', {
              statusCode: proxyRes.statusCode,
              headers: proxyRes.headers
            });
          });
        }
      },
      '/cloudflare-api': {
        target: 'https://api.cloudflare.com/client/v4',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cloudflare-api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Cloudflare API proxy error', err);
          });
        }
      },
    },
  },
});
