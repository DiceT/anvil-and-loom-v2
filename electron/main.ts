import { app, BrowserWindow, protocol, net } from 'electron';
import path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
// Register privileged schemes for media protocol
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { secure: true, supportFetchAPI: true, standard: true, bypassCSP: true, stream: true } }
]);

import { setupFileSystemHandlers } from './ipc/fileSystem.js';
import { setupStorageHandlers } from './ipc/storage.js';
import { setupSettingsHandlers } from './ipc/settings.js';
import { registerTapestryHandlers } from './ipc/tapestry.js';
import { registerWeaveHandlers } from './ipc/weaves.js';
import { registerDmChatHandlers } from './ipc/dmChat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true, // explicit default
    },
  });

  // In development, load from Vite dev server
  // electron-vite sets ELECTRON_RENDERER_URL in dev mode
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set up IPC handlers
  setupFileSystemHandlers();
  setupStorageHandlers();
  setupSettingsHandlers();
  registerTapestryHandlers();
  registerWeaveHandlers();
  registerDmChatHandlers();

  // Register media protocol for local file access
  protocol.handle('media', async (request) => {
    try {
      // Parse URL to handle drive letters correctly
      // When "standard: true" is set, "media://c/Path" treats "c" as hostname
      const parsedUrl = new URL(request.url);
      let filePath = '';

      if (parsedUrl.hostname && parsedUrl.hostname.length === 1 && process.platform === 'win32') {
        // Case: media://c/Users/... -> hostname is "c"
        filePath = `${parsedUrl.hostname}:${parsedUrl.pathname}`;
      } else {
        // Case: media:///C:/Users... -> hostname empty, pathname is /C:/Users...
        // On Windows, strip leading slash from pathname if it looks like a drive path
        filePath = parsedUrl.pathname;
        if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(filePath)) {
          filePath = filePath.slice(1);
        }
      }

      // Decode URL encoding (spaces -> ' ', etc)
      const decodedPath = decodeURIComponent(filePath);

      console.log('[media-protocol] Request:', request.url);
      console.log('[media-protocol] Decoded:', decodedPath);

      const buffer = await fs.readFile(decodedPath);

      const ext = path.extname(decodedPath).toLowerCase();
      let mimeType = 'application/octet-stream';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.svg') mimeType = 'image/svg+xml';

      return new Response(buffer, {
        headers: {
          'content-type': mimeType,
          'cache-control': 'public, max-age=3600'
        }
      });
    } catch (error) {
      console.error('[media-protocol] Failed:', request.url, error);
      return new Response('Not Found', { status: 404 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
