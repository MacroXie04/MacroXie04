import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@assets': fileURLToPath(new URL('../assets', import.meta.url)),
    },
  },
  publicDir: '../assets',
  build: {
    outDir: 'build',
  },
});
