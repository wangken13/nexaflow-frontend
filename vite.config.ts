import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            element: ['element-plus'],
            utilities: ['axios']
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_GATEWAY_TARGET || env.VITE_GATEWAY_TARGET || 'http://localhost:18080',
          changeOrigin: true
        }
      }
    }
  }
})
