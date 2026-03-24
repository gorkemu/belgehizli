import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('error', (err) => console.log('Proxy Error:', err))
          proxy.on('proxyReq', (req) => console.log('Proxy Request:', req.path))
        }
      }
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly', // Sadece camelCase kullanımı
      generateScopedName: '[name]__[local]___[hash:base64:5]' // Class naming pattern
    }
  }
})