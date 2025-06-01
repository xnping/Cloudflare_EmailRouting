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
      },
      '/cloudflare-api': {
        target: 'https://api.cloudflare.com/client/v4',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cloudflare-api/, ''),
      },
    },
  },
});
