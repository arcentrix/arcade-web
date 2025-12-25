import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { PluginOption } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => {
  const plugins: PluginOption[] = [react()]

  if (mode === 'analysis' && command === 'build') {
    plugins.push(
      visualizer({
        open: true,
        filename: `dist/analysis.html`,
      }),
    )
  }

  return {
    plugins,
    base: process.env.VITE_BASE_PATH || '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        // /version 接口特殊处理，直接代理到后端根路径
        '/api/version': {
          target: process.env.VITE_API_URL || 'http://127.0.0.1:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''), // 将 /api/version 重写为 /version
        },
        // SSE 日志流接口特殊处理，需要保持连接打开
        '/api/v1/pipelines/logs/stream': {
          target: process.env.VITE_API_URL || 'http://127.0.0.1:8080',
          changeOrigin: true,
          ws: false, // SSE 不是 WebSocket
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // 设置 SSE 相关 headers
              proxyReq.setHeader('Accept', 'text/event-stream');
              proxyReq.setHeader('Cache-Control', 'no-cache');
              proxyReq.setHeader('Connection', 'keep-alive');
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              // 确保响应头正确设置
              proxyRes.headers['content-type'] = 'text/event-stream';
              proxyRes.headers['cache-control'] = 'no-cache';
              proxyRes.headers['connection'] = 'keep-alive';
            });
          },
        },
        '/api': {
          target: process.env.VITE_API_URL || 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: mode === 'analysis',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
          },

          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name?.split('.').pop()?.toLowerCase()

            if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext || '')) {
              return 'images/[name]-[hash][extname]'
            }

            if (['js'].includes(ext || '')) {
              return 'assets/js/[name]-[hash][extname]'
            }

            if (['css'].includes(ext || '')) {
              return 'assets/css/[name]-[hash][extname]'
            }

            if (['woff', 'woff2', 'ttf', 'eot'].includes(ext || '')) {
              return 'fonts/[name]-[hash][extname]'
            }

            return 'assets/[name]-[hash][extname]'
          },
        },
      },
    },
  }
})
