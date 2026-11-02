import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// 前端构建配置：开发时代理到本地 API，生产构建输出到 web/dist 由 Express 托管。
export default defineConfig({
  root: path.resolve(import.meta.dirname),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': { target: process.env.API_PROXY || 'http://localhost:8787', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Rolldown(Vite 8) 要求 manualChunks 为函数形式
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'router';
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) return 'react';
            if (id.includes('zustand')) return 'state';
            return 'vendor';
          }
        }
      }
    }
  }
});