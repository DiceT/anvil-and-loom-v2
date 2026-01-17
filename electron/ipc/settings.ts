import { ipcMain, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

function getUserDataPath() {
    return app.getPath('userData');
}

function getLayoutFilePath() {
    return path.join(getUserDataPath(), 'layout.json');
}

export function setupSettingsHandlers() {
    ipcMain.handle('settings:saveLayout', async (_, layout: any) => {
        try {
            await fs.writeFile(getLayoutFilePath(), JSON.stringify(layout, null, 2));
            return { success: true };
        } catch (error) {
            console.error('Failed to save layout:', error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('settings:loadLayout', async () => {
        try {
            const data = await fs.readFile(getLayoutFilePath(), 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Return null if file doesn't exist
            return null;
        }
    });

    ipcMain.handle('settings:resetLayout', async () => {
        try {
            await fs.unlink(getLayoutFilePath());
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    });
}
