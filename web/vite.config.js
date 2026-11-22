import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 개발할 때(npm run dev): /api 를 내 PC의 서버(8080)로 넘겨요
export default defineConfig({
  plugins: [react()],
  // 화면 오류에 어느 판(빌드)에서 났는지 붙여요 (concept 11-26)
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16)) },
  build: {
    assetsInlineLimit: 0,
    // 자주 안 바뀌는 묶음은 따로: 새 판을 올려도 휴대폰에 받아 둔 걸 그대로 써요 (concept 11-27)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
          if (id.includes('/src/content/')) return 'talks';
          return undefined;
        },
      },
    },
  },
  server: { port: 5173, host: true, proxy: { '/api': 'http://localhost:8080' } },
});
