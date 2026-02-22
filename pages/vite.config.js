import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const deployTarget = process.env.DEPLOY_TARGET;
  const isGitHubPages = deployTarget === 'github-pages';

  return {
  plugins: [react()],
  base: isGitHubPages ? '/MacroXie04/' : '/',
  build: {
    outDir: 'build',
  },
  };
});
