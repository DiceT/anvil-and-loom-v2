import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use ipcRenderer
contextBridge.exposeInMainWorld('electron', {
  tapestry: {
    getTree: () => ipcRenderer.invoke('tapestry:getTree'),
    readEntry: (path: string) => ipcRenderer.invoke('tapestry:readEntry', path),
    writeEntry: (path: string, content: string) =>
      ipcRenderer.invoke('tapestry:writeEntry', path, content),
    saveResults: (cards: unknown[]) =>
      ipcRenderer.invoke('tapestry:saveResults', cards),
    loadResults: () => ipcRenderer.invoke('tapestry:loadResults'),
  },
});
