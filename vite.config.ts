import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { __STORI_BACKEND_PORT__: JSON.stringify(process.env.LOCAL_BACKEND_PORT || '8080') },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:' + (process.env.LOCAL_BACKEND_PORT || '8080'), changeOrigin: true },
      '/v3': { target: 'http://127.0.0.1:' + (process.env.LOCAL_BACKEND_PORT || '8080'), changeOrigin: true }
    }
  }
});
