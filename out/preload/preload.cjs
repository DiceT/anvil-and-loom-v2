"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  tapestry: {
    getTree: () => electron.ipcRenderer.invoke("tapestry:getTree"),
    readEntry: (path) => electron.ipcRenderer.invoke("tapestry:readEntry", path),
    writeEntry: (path, content) => electron.ipcRenderer.invoke("tapestry:writeEntry", path, content),
    saveResults: (cards) => electron.ipcRenderer.invoke("tapestry:saveResults", cards),
    loadResults: () => electron.ipcRenderer.invoke("tapestry:loadResults")
  },
  tables: {
    loadAll: () => electron.ipcRenderer.invoke("tables:loadAll"),
    getUserDir: () => electron.ipcRenderer.invoke("tables:getUserDir")
  },
  weaves: {
    loadAll: () => electron.ipcRenderer.invoke("weaves:loadAll"),
    save: (weave) => electron.ipcRenderer.invoke("weaves:save", weave),
    delete: (id) => electron.ipcRenderer.invoke("weaves:delete", id)
  }
});
