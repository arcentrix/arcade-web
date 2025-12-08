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
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:8080',
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
