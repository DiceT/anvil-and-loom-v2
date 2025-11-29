"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  tapestry: {
    // Registry management
    loadRegistry: () => electron.ipcRenderer.invoke("tapestry:loadRegistry"),
    create: (data) => electron.ipcRenderer.invoke("tapestry:create", data),
    open: (id) => electron.ipcRenderer.invoke("tapestry:open", id),
    update: (id, updates) => electron.ipcRenderer.invoke("tapestry:update", id, updates),
    remove: (id) => electron.ipcRenderer.invoke("tapestry:remove", id),
    delete: (id) => electron.ipcRenderer.invoke("tapestry:delete", id),
    // Tree management
    loadTree: (tapestryId) => electron.ipcRenderer.invoke("tapestry:loadTree", tapestryId),
    // Entry management
    loadEntry: (path) => electron.ipcRenderer.invoke("tapestry:loadEntry", path),
    saveEntry: (entry) => electron.ipcRenderer.invoke("tapestry:saveEntry", entry),
    createEntry: (parentPath, title, category) => electron.ipcRenderer.invoke("tapestry:createEntry", parentPath, title, category),
    // File operations
    createFolder: (parentPath, name) => electron.ipcRenderer.invoke("tapestry:createFolder", parentPath, name),
    rename: (oldPath, newName) => electron.ipcRenderer.invoke("tapestry:rename", oldPath, newName),
    deleteNode: (path) => electron.ipcRenderer.invoke("tapestry:deleteNode", path),
    move: (sourcePath, destinationFolder, itemName) => electron.ipcRenderer.invoke("tapestry:move", sourcePath, destinationFolder, itemName),
    updateOrder: (folderPath, order) => electron.ipcRenderer.invoke("tapestry:updateOrder", folderPath, order),
    pickImage: (defaultPath) => electron.ipcRenderer.invoke("tapestry:pickImage", defaultPath)
  },
  tables: {
    loadAll: () => electron.ipcRenderer.invoke("tables:loadAll"),
    getUserDir: () => electron.ipcRenderer.invoke("tables:getUserDir")
  },
  weaves: {
    loadAll: () => electron.ipcRenderer.invoke("weaves:loadAll"),
    save: (weave) => electron.ipcRenderer.invoke("weaves:save", weave),
    delete: (id) => electron.ipcRenderer.invoke("weaves:delete", id)
  },
  settings: {
    saveLayout: (layout) => electron.ipcRenderer.invoke("settings:saveLayout", layout),
    loadLayout: () => electron.ipcRenderer.invoke("settings:loadLayout"),
    resetLayout: () => electron.ipcRenderer.invoke("settings:resetLayout")
  }
});
