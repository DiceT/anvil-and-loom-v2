// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
var __electron_vite_injected_dirname = "E:\\Anvil and Loom\\anvil-and-loom-v2";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: "electron/main.ts",
        formats: ["cjs"]
      },
      rollupOptions: {
        external: ["seedrandom", "uuid"]
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: "electron/preload.ts",
        formats: ["cjs"]
      },
      rollupOptions: {
        external: ["seedrandom", "uuid"]
      }
    }
  },
  renderer: {
    root: ".",
    resolve: {
      alias: {
        "@": resolve(__electron_vite_injected_dirname, "src")
      }
    },
    build: {
      outDir: "out/renderer",
      rollupOptions: {
        input: resolve(__electron_vite_injected_dirname, "index.html"),
        external: ["seedrandom", "uuid"]
      }
    },
    plugins: [react()]
  }
});
export {
  electron_vite_config_default as default
};
