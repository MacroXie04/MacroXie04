import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const deployTarget = process.env.DEPLOY_TARGET;
  const isGitHubPages = deployTarget === 'github-pages';
  const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000';

  return {
  plugins: [react()],
  base: isGitHubPages ? '/MacroXie04/' : '/',
  build: {
    outDir: 'build',
  },
  server: {
    proxy: {
      '/api': { target: apiProxyTarget, changeOrigin: true },
      '/media': { target: apiProxyTarget, changeOrigin: true },
    },
  },
  };
});
