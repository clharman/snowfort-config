import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4040,
    host: 'localhost'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});