import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

const USER_DATA_PATH = app.getPath('userData');
const LAYOUT_FILE = path.join(USER_DATA_PATH, 'layout.json');

export function setupSettingsHandlers() {
    ipcMain.handle('settings:saveLayout', async (_, layout: any) => {
        try {
            await fs.writeFile(LAYOUT_FILE, JSON.stringify(layout, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Failed to save layout:', error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('settings:loadLayout', async () => {
        try {
            const data = await fs.readFile(LAYOUT_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Return null if file doesn't exist
            return null;
        }
    });

    ipcMain.handle('settings:resetLayout', async () => {
        try {
            await fs.unlink(LAYOUT_FILE);
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    });
}
