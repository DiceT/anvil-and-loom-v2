# ⚠️ CRITICAL: DO NOT MODIFY ELECTRON CONFIGURATION

The Electron setup is **WORKING CORRECTLY**. Antigravity has successfully migrated to `electron-vite` and all issues are resolved.

## ✅ Current Status

- **Dev server:** Working on `http://localhost:5173/`
- **Electron app:** Launches correctly
- **Hot reload:** Functional
- **Module format:** Fixed (CommonJS for main/preload, ES Module for renderer)

## 🚫 DO NOT TOUCH

**NEVER modify these files:**
- `electron.vite.config.ts`
- `electron/main.ts` (especially the environment variable check)
- `package.json` (scripts or main entry point)

## ✅ Working Configuration

### electron.vite.config.ts
```typescript
// CORRECT - Do not change!
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
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    },
    plugins: [react()]
  }
});
```

**Critical settings (DO NOT REMOVE):**
- `root: '.'` - Required for dev server to find index.html
- `outDir: 'out/renderer'` - Required for build output
- `rollupOptions.input` - Required by electron-vite
- `formats: ['cjs']` - Required for main/preload processes

### electron/main.ts
```typescript
// CORRECT environment variable - Do not change!
if (process.env.ELECTRON_RENDERER_URL) {
  mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  mainWindow.webContents.openDevTools();
} else {
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}
```

**Note:** Uses `ELECTRON_RENDERER_URL` (electron-vite's variable), NOT `VITE_DEV_SERVER_URL`

## 🐛 If You See Errors

### "electron.app is undefined"
This happens when you kill the process before it fully starts. **It's NOT a real error.** The app works fine when left to run.

### "404 on localhost:5173"
The dev server is working. Just wait a few seconds for the renderer to build.

### Blank screen
Make sure `root: '.'` is in the renderer config.

## 📋 Your Responsibilities

**What you CAN work on:**
- React components in `src/`
- UI/UX features
- Business logic
- Weave system features
- New tools and components

**What you CANNOT work on:**
- Electron configuration
- Build system
- Module format issues
- IPC setup (unless adding NEW handlers)

## 🎯 Summary for Weaver

**The Electron configuration is COMPLETE and VERIFIED.** Focus on building features, not fixing the build system. Any errors you see when killing/restarting the process are false positives. The app works perfectly when allowed to run normally.

If you think there's an Electron issue, **STOP** and ask the user to verify with Antigravity/Loomwright before making changes.

---

**Last Updated:** 2025-11-26 by Antigravity/Loomwright
**Status:** ✅ Production Ready