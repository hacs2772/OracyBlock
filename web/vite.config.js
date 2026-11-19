import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 개발할 때(npm run dev): /api 를 내 PC의 서버(8080)로 넘겨요
export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0 },
  server: { port: 5173, host: true, proxy: { '/api': 'http://localhost:8080' } },
});
