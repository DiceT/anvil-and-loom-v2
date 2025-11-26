"use strict";
const electron = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs/promises");
const stubbedTapestry = {
  name: "My Campaign",
  children: [
    {
      name: "session-01.md",
      type: "file",
      path: "/session-01.md"
    },
    {
      name: "session-02.md",
      type: "file",
      path: "/session-02.md"
    },
    {
      name: "lair.canvas.json",
      type: "file",
      path: "/lair.canvas.json"
    },
    {
      name: "notes",
      type: "folder",
      path: "/notes",
      children: [
        {
          name: "npc-ideas.md",
          type: "file",
          path: "/notes/npc-ideas.md"
        }
      ]
    }
  ]
};
const stubbedEntries = {
  "/session-01.md": "# Session 1\n\nOur adventure begins...",
  "/session-02.md": "# Session 2\n\nThe party continues...",
  "/lair.canvas.json": '{"version":"1.0.0","nodes":[{"id":"1","type":"text","x":100,"y":100,"text":"Entrance"}]}',
  "/notes/npc-ideas.md": "# NPC Ideas\n\n- A mysterious wanderer\n- The innkeeper"
};
function setupFileSystemHandlers() {
  electron.ipcMain.handle("tapestry:getTree", async () => {
    return stubbedTapestry;
  });
  electron.ipcMain.handle("tapestry:readEntry", async (_event, path2) => {
    return stubbedEntries[path2] || "";
  });
  electron.ipcMain.handle(
    "tapestry:writeEntry",
    async (_event, path2, content) => {
      stubbedEntries[path2] = content;
      return { success: true };
    }
  );
}
let resultsCache = [];
function setupStorageHandlers() {
  electron.ipcMain.handle("tapestry:saveResults", async (_event, cards) => {
    resultsCache = cards;
    return { success: true };
  });
  electron.ipcMain.handle("tapestry:loadResults", async () => {
    return resultsCache;
  });
}
const CORE_TABLES_DIR = path.join(process.cwd(), "app", "core-data", "tables");
function getUserDataDir() {
  return path.join(electron.app.getPath("userData"), "AnvilAndLoom", "assets", "tables");
}
async function loadJsonFilesFromDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    return [];
  }
  try {
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const results = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, "utf-8");
          const data = JSON.parse(content);
          const filename = path.basename(file, ".json");
          return { filename, data };
        } catch (error) {
          console.error(`Failed to load ${file}:`, error);
          return null;
        }
      })
    );
    return results.filter((r) => r !== null);
  } catch (error) {
    console.error(`Failed to read directory ${dirPath}:`, error);
    return [];
  }
}
async function loadAllTables() {
  const [coreAspects, coreDomains, coreOracles, userAspects, userDomains, userOracles] = await Promise.all([
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, "aspects")),
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, "domains")),
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, "oracles")),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), "aspects")),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), "domains")),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), "oracles"))
  ]);
  return {
    aspects: {
      core: coreAspects,
      user: userAspects
    },
    domains: {
      core: coreDomains,
      user: userDomains
    },
    oracles: {
      core: coreOracles,
      user: userOracles
    }
  };
}
function setupTableHandlers() {
  electron.ipcMain.handle("tables:loadAll", async () => {
    try {
      const tables = await loadAllTables();
      return {
        success: true,
        data: tables
      };
    } catch (error) {
      console.error("Failed to load tables:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
  electron.ipcMain.handle("tables:getUserDir", async () => {
    return getUserDataDir();
  });
}
const CORE_WEAVES_DIR = path.join(process.cwd(), "app", "core-data", "weaves");
function getUserWeavesDir() {
  return path.join(electron.app.getPath("userData"), "AnvilAndLoom", "assets", "weaves");
}
async function loadWeavesFromDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    return [];
  }
  try {
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const results = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, "utf-8");
          const data = JSON.parse(content);
          return data;
        } catch (error) {
          console.error(`Failed to load ${file}:`, error);
          return null;
        }
      })
    );
    return results.filter((r) => r !== null);
  } catch (error) {
    console.error(`Failed to read directory ${dirPath}:`, error);
    return [];
  }
}
async function loadAllWeaves() {
  const [coreWeaves, userWeaves] = await Promise.all([
    loadWeavesFromDirectory(CORE_WEAVES_DIR),
    loadWeavesFromDirectory(getUserWeavesDir())
  ]);
  const weaveMap = /* @__PURE__ */ new Map();
  coreWeaves.forEach((weave) => {
    weaveMap.set(weave.id, weave);
  });
  userWeaves.forEach((weave) => {
    weaveMap.set(weave.id, weave);
  });
  return Array.from(weaveMap.values());
}
function setupWeaveHandlers() {
  electron.ipcMain.handle("weaves:loadAll", async () => {
    try {
      const weaves = await loadAllWeaves();
      return {
        success: true,
        data: weaves
      };
    } catch (error) {
      console.error("Failed to load weaves:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
  electron.ipcMain.handle("weaves:save", async (_event, weave) => {
    try {
      await fs.mkdir(getUserWeavesDir(), { recursive: true });
      const filePath = path.join(getUserWeavesDir(), `${weave.id}.json`);
      const content = JSON.stringify(weave, null, 2);
      await fs.writeFile(filePath, content, "utf-8");
      return {
        success: true
      };
    } catch (error) {
      console.error("Failed to save weave:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
  electron.ipcMain.handle("weaves:delete", async (_event, id) => {
    try {
      const filePath = path.join(getUserWeavesDir(), `${id}.json`);
      await fs.unlink(filePath);
      return {
        success: true
      };
    } catch (error) {
      console.error("Failed to delete weave:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
}
const __filename$1 = url.fileURLToPath(require("url").pathToFileURL(__filename).href);
const __dirname$1 = path.dirname(__filename$1);
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname$1, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../renderer/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.app.whenReady().then(() => {
  setupFileSystemHandlers();
  setupStorageHandlers();
  setupTableHandlers();
  setupWeaveHandlers();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
