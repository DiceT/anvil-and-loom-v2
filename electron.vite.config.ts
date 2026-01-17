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
            },
            rollupOptions: {
                external: ['seedrandom', 'uuid']
            }
        }
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            lib: {
                entry: 'electron/preload.ts',
                formats: ['cjs']
            },
            rollupOptions: {
                external: ['seedrandom', 'uuid']
            }
        }
    },
    renderer: {
        root: '.',
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        },
        build: {
            outDir: 'out/renderer',
            rollupOptions: {
                input: resolve(__dirname, 'index.html'),
                external: ['seedrandom', 'uuid']
            }
        },
        plugins: [react()]
    }
});
