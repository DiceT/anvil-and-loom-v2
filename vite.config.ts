import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Renderer-only config - electron-vite handles main and preload
export default defineConfig({
  plugins: [react()],
});
