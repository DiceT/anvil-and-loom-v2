import { contextBridge, ipcRenderer } from 'electron';

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
    getAllPanels: (tapestryId: string) => ipcRenderer.invoke('tapestry:getAllPanels', tapestryId),
  },
  weave: {
    // Tapestry path management
    setTapestryPath: (path: string) => ipcRenderer.invoke('weave:setTapestryPath', path),
    
    // Table management
    getTables: () => ipcRenderer.invoke('weave:getTables'),
    getTable: (tableId: string) => ipcRenderer.invoke('weave:getTable', tableId),
    saveTable: (table: any) => ipcRenderer.invoke('weave:saveTable', table),
    deleteTable: (tableId: string) => ipcRenderer.invoke('weave:deleteTable', tableId),
    
    // Rolling
    rollTable: (tableId: string, seed?: string) => ipcRenderer.invoke('weave:rollTable', tableId, seed),
  },
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  },
  settings: {
    saveLayout: (layout: any) => ipcRenderer.invoke('settings:saveLayout', layout),
    loadLayout: () => ipcRenderer.invoke('settings:loadLayout'),
    resetLayout: () => ipcRenderer.invoke('settings:resetLayout'),
  },
});
