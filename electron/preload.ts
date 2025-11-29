import { contextBridge, ipcRenderer } from 'electron';
import type { Weave } from '../src/core/weave/weaveTypes';

// Expose protected methods that allow the renderer process to use ipcRenderer
contextBridge.exposeInMainWorld('electron', {
  tapestry: {
    // Registry management
    loadRegistry: () => ipcRenderer.invoke('tapestry:loadRegistry'),
    create: (data: any) => ipcRenderer.invoke('tapestry:create', data),
    open: (id: string) => ipcRenderer.invoke('tapestry:open', id),
    update: (id: string, updates: any) => ipcRenderer.invoke('tapestry:update', id, updates),
    remove: (id: string) => ipcRenderer.invoke('tapestry:remove', id),
    delete: (id: string) => ipcRenderer.invoke('tapestry:delete', id),

    // Tree management
    loadTree: (tapestryId: string) => ipcRenderer.invoke('tapestry:loadTree', tapestryId),

    // Entry management
    loadEntry: (path: string) => ipcRenderer.invoke('tapestry:loadEntry', path),
    saveEntry: (entry: any) => ipcRenderer.invoke('tapestry:saveEntry', entry),
    createEntry: (parentPath: string, title: string, category: string) =>
      ipcRenderer.invoke('tapestry:createEntry', parentPath, title, category),

    // File operations
    createFolder: (parentPath: string, name: string) =>
      ipcRenderer.invoke('tapestry:createFolder', parentPath, name),
    rename: (oldPath: string, newName: string) =>
      ipcRenderer.invoke('tapestry:rename', oldPath, newName),
    deleteNode: (path: string) => ipcRenderer.invoke('tapestry:deleteNode', path),
    move: (sourcePath: string, destinationFolder: string, itemName: string) =>
      ipcRenderer.invoke('tapestry:move', sourcePath, destinationFolder, itemName),
    updateOrder: (folderPath: string, order: string[]) =>
      ipcRenderer.invoke('tapestry:updateOrder', folderPath, order),
    pickImage: (defaultPath?: string) => ipcRenderer.invoke('tapestry:pickImage', defaultPath),
  },
  tables: {
    loadAll: () => ipcRenderer.invoke('tables:loadAll'),
    getUserDir: () => ipcRenderer.invoke('tables:getUserDir'),
  },
  weaves: {
    loadAll: () => ipcRenderer.invoke('weaves:loadAll') as Promise<{ success: boolean; data?: Weave[]; error?: string }>,
    save: (weave: Weave) => ipcRenderer.invoke('weaves:save', weave) as Promise<{ success: boolean; error?: string }>,
    delete: (id: string) => ipcRenderer.invoke('weaves:delete', id) as Promise<{ success: boolean; error?: string }>,
  },
  settings: {
    saveLayout: (layout: any) => ipcRenderer.invoke('settings:saveLayout', layout),
    loadLayout: () => ipcRenderer.invoke('settings:loadLayout'),
    resetLayout: () => ipcRenderer.invoke('settings:resetLayout'),
  },
});
