import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            lib: {
                entry: 'electron/main.ts',
                formats: ['cjs']
            }
        }
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            lib: {
                entry: 'electron/preload.ts',
                formats: ['cjs']
            }
        }
    },
    renderer: {
        root: '.',
        build: {
            rollupOptions: {
                input: resolve(__dirname, 'index.html')
            }
        },
        plugins: [react()]
    }
});
