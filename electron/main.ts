import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { setupFileSystemHandlers } from './ipc/fileSystem.js';
import { setupStorageHandlers } from './ipc/storage.js';
import { setupTableHandlers } from './ipc/tables.js';
import { setupWeaveHandlers } from './ipc/weaves.js';
import { setupSettingsHandlers } from './ipc/settings.js';
import { registerTapestryHandlers } from './ipc/tapestry.js';

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
  setupTableHandlers();
  setupWeaveHandlers();
  setupSettingsHandlers();
  registerTapestryHandlers();

  // Register custom protocol for local media
  session.defaultSession.protocol.handle('media', async (request) => {
    // Strip protocol - URL will be like media:///C:/path/to/file
    let filePath = request.url.replace('media://', '');

    // Remove leading slash from URLs like /C:/path (Windows absolute paths)
    if (filePath.startsWith('/') && filePath.length > 2 && filePath[2] === ':') {
      filePath = filePath.substring(1);
    }

    // Decode URL to handle spaces and other characters
    try {
      filePath = decodeURIComponent(filePath);
    } catch (e) {
      console.error('[media protocol] Failed to decode path:', filePath, e);
    }

    // Remove trailing slash if present (some browsers add it)
    if (filePath.endsWith('/')) {
      filePath = filePath.slice(0, -1);
    }

    console.log('[media protocol] Attempting to load:', filePath);

    try {
      const data = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      console.log('[media protocol] Successfully loaded:', filePath);
      return new Response(data, {
        headers: { 'Content-Type': contentType }
      });
    } catch (error) {
      console.error('[media protocol] Failed to read file:', filePath, error);
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
