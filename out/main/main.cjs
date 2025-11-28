"use strict";
const electron = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs/promises");
const matter = require("gray-matter");
const uuid = require("uuid");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
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
const USER_DATA_PATH = electron.app.getPath("userData");
const LAYOUT_FILE = path.join(USER_DATA_PATH, "layout.json");
function setupSettingsHandlers() {
  electron.ipcMain.handle("settings:saveLayout", async (_, layout) => {
    try {
      await fs.writeFile(LAYOUT_FILE, JSON.stringify(layout, null, 2));
      return { success: true };
    } catch (error) {
      console.error("Failed to save layout:", error);
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("settings:loadLayout", async () => {
    try {
      const data = await fs.readFile(LAYOUT_FILE, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  });
  electron.ipcMain.handle("settings:resetLayout", async () => {
    try {
      await fs.unlink(LAYOUT_FILE);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  });
}
const REGISTRY_FILE = "tapestries.json";
function getRegistryPath() {
  return path__namespace.join(electron.app.getPath("userData"), REGISTRY_FILE);
}
async function loadRegistry() {
  const registryPath = getRegistryPath();
  try {
    const data = await fs__namespace.readFile(registryPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return { tapestries: [] };
  }
}
async function saveRegistry(registry) {
  const registryPath = getRegistryPath();
  await fs__namespace.writeFile(registryPath, JSON.stringify(registry, null, 2), "utf-8");
}
async function scaffoldTapestry(tapestryPath, config) {
  await fs__namespace.mkdir(tapestryPath, { recursive: true });
  const loomDir = path__namespace.join(tapestryPath, ".loom");
  await fs__namespace.mkdir(loomDir, { recursive: true });
  const configPath = path__namespace.join(loomDir, "tapestry.json");
  await fs__namespace.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  const entriesDir = path__namespace.join(tapestryPath, "entries");
  await fs__namespace.mkdir(entriesDir, { recursive: true });
  const welcomeId = uuid.v4();
  const welcomeFrontmatter = {
    id: welcomeId,
    title: "The First Thread",
    category: "session",
    tags: ["intro"]
  };
  const welcomeContent = `# The First Thread

Welcome to your new Tapestry!

This is your first entry. You can edit this text, add new entries, and organize your world.

**What's next?**
- Roll some dice or oracles to generate story seeds
- Create new entries for NPCs, locations, or lore
- Start weaving your narrative

The journey begins here.
`;
  const welcomeMarkdown = matter.stringify(welcomeContent, welcomeFrontmatter);
  const welcomePath = path__namespace.join(entriesDir, "The First Thread.md");
  await fs__namespace.writeFile(welcomePath, welcomeMarkdown, "utf-8");
}
async function parseEntry(filePath) {
  const fileContent = await fs__namespace.readFile(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  return {
    frontmatter: data,
    content
  };
}
async function buildTree(dirPath, orderPath) {
  const items = await fs__namespace.readdir(dirPath, { withFileTypes: true });
  let order = [];
  if (orderPath) {
    try {
      const orderData = await fs__namespace.readFile(orderPath, "utf-8");
      const orderJson = JSON.parse(orderData);
      order = orderJson.entries || [];
    } catch {
    }
  }
  const nodes = [];
  const processedNames = /* @__PURE__ */ new Set();
  for (const name of order) {
    const item = items.find((i) => i.name === name);
    if (item) {
      const node = await buildNode(dirPath, item);
      if (node) {
        nodes.push(node);
        processedNames.add(name);
      }
    }
  }
  const remaining = items.filter((item) => !processedNames.has(item.name) && !item.name.startsWith(".")).sort((a, b) => a.name.localeCompare(b.name));
  for (const item of remaining) {
    const node = await buildNode(dirPath, item);
    if (node) {
      nodes.push(node);
    }
  }
  return nodes;
}
async function buildNode(parentPath, item) {
  const itemPath = path__namespace.join(parentPath, item.name);
  if (item.isDirectory()) {
    if (item.name === ".loom") return null;
    const children = await buildTree(itemPath, path__namespace.join(itemPath, ".loom", "order.json"));
    return {
      id: itemPath,
      type: "folder",
      name: item.name,
      path: itemPath,
      children
    };
  } else if (item.isFile() && item.name.endsWith(".md")) {
    try {
      const { frontmatter } = await parseEntry(itemPath);
      return {
        id: frontmatter.id,
        type: "entry",
        name: frontmatter.title || item.name.replace(".md", ""),
        path: itemPath,
        category: frontmatter.category
      };
    } catch (error) {
      console.error(`Error parsing entry ${itemPath}:`, error);
      return null;
    }
  }
  return null;
}
function registerTapestryHandlers() {
  electron.ipcMain.handle("tapestry:loadRegistry", async () => {
    return await loadRegistry();
  });
  electron.ipcMain.handle("tapestry:create", async (_, data) => {
    const registry = await loadRegistry();
    const id = uuid.v4();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const basePath = data.basePath || path__namespace.join(electron.app.getPath("documents"), "Anvil and Loom", "Tapestries");
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const tapestryPath = path__namespace.join(basePath, slug);
    const config = {
      id,
      name: data.name,
      description: data.description,
      imagePath: data.imagePath,
      defaultEntryCategory: "session"
    };
    await scaffoldTapestry(tapestryPath, config);
    const entry = {
      id,
      name: data.name,
      path: tapestryPath,
      description: data.description,
      imagePath: data.imagePath,
      createdAt: now,
      updatedAt: now
    };
    registry.tapestries.push(entry);
    await saveRegistry(registry);
    return id;
  });
  electron.ipcMain.handle("tapestry:open", async (_, id) => {
    const registry = await loadRegistry();
    const entry = registry.tapestries.find((t) => t.id === id);
    if (!entry) return null;
    const configPath = path__namespace.join(entry.path, ".loom", "tapestry.json");
    try {
      const configData = await fs__namespace.readFile(configPath, "utf-8");
      const config = JSON.parse(configData);
      entry.lastOpenedAt = (/* @__PURE__ */ new Date()).toISOString();
      await saveRegistry(registry);
      return config;
    } catch (error) {
      console.error(`Error loading tapestry config:`, error);
      return null;
    }
  });
  electron.ipcMain.handle("tapestry:update", async (_, id, updates) => {
    const registry = await loadRegistry();
    const entry = registry.tapestries.find((t) => t.id === id);
    if (!entry) throw new Error("Tapestry not found");
    if (updates.name) entry.name = updates.name;
    if (updates.description !== void 0) entry.description = updates.description;
    if (updates.imagePath !== void 0) entry.imagePath = updates.imagePath;
    entry.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await saveRegistry(registry);
    const configPath = path__namespace.join(entry.path, ".loom", "tapestry.json");
    const configData = await fs__namespace.readFile(configPath, "utf-8");
    const config = JSON.parse(configData);
    if (updates.name) config.name = updates.name;
    if (updates.description !== void 0) config.description = updates.description;
    if (updates.imagePath !== void 0) config.imagePath = updates.imagePath;
    await fs__namespace.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  });
  electron.ipcMain.handle("tapestry:remove", async (_, id) => {
    const registry = await loadRegistry();
    registry.tapestries = registry.tapestries.filter((t) => t.id !== id);
    await saveRegistry(registry);
  });
  electron.ipcMain.handle("tapestry:delete", async (_, id) => {
    const registry = await loadRegistry();
    const entry = registry.tapestries.find((t) => t.id === id);
    if (!entry) throw new Error("Tapestry not found");
    await fs__namespace.rm(entry.path, { recursive: true, force: true });
    registry.tapestries = registry.tapestries.filter((t) => t.id !== id);
    await saveRegistry(registry);
  });
  electron.ipcMain.handle("tapestry:loadTree", async (_, tapestryId) => {
    const registry = await loadRegistry();
    const entry = registry.tapestries.find((t) => t.id === tapestryId);
    if (!entry) return null;
    const entriesPath = path__namespace.join(entry.path, "entries");
    const children = await buildTree(entriesPath, path__namespace.join(entriesPath, ".loom", "order.json"));
    return {
      id: entry.id,
      type: "folder",
      name: entry.name,
      path: entriesPath,
      children
    };
  });
  electron.ipcMain.handle("tapestry:loadEntry", async (_, entryPath) => {
    try {
      const { frontmatter, content } = await parseEntry(entryPath);
      return {
        id: frontmatter.id,
        path: entryPath,
        title: frontmatter.title,
        category: frontmatter.category,
        content,
        frontmatter,
        isDirty: false
      };
    } catch (error) {
      console.error(`Error loading entry:`, error);
      return null;
    }
  });
  electron.ipcMain.handle("tapestry:saveEntry", async (_, entry) => {
    const markdown = matter.stringify(entry.content, entry.frontmatter);
    await fs__namespace.writeFile(entry.path, markdown, "utf-8");
  });
  electron.ipcMain.handle("tapestry:createEntry", async (_, parentPath, title, category) => {
    const id = uuid.v4();
    const frontmatter = {
      id,
      title,
      category,
      tags: []
    };
    const content = `# ${title}

Your content here...
`;
    const markdown = matter.stringify(content, frontmatter);
    const fileName = `${title}.md`;
    const filePath = path__namespace.join(parentPath, fileName);
    await fs__namespace.writeFile(filePath, markdown, "utf-8");
    return id;
  });
  electron.ipcMain.handle("tapestry:createFolder", async (_, parentPath, name) => {
    const folderPath = path__namespace.join(parentPath, name);
    await fs__namespace.mkdir(folderPath, { recursive: true });
  });
  electron.ipcMain.handle("tapestry:rename", async (_, oldPath, newName) => {
    const parentDir = path__namespace.dirname(oldPath);
    const ext = path__namespace.extname(oldPath);
    let finalName = newName;
    if (ext && !newName.endsWith(ext)) {
      finalName += ext;
    }
    const newPath = path__namespace.join(parentDir, finalName);
    await fs__namespace.rename(oldPath, newPath);
    if (finalName.endsWith(".md")) {
      try {
        const fileContent = await fs__namespace.readFile(newPath, "utf-8");
        const { data, content } = matter(fileContent);
        data.title = newName.replace(".md", "");
        const updatedMarkdown = matter.stringify(content, data);
        await fs__namespace.writeFile(newPath, updatedMarkdown, "utf-8");
      } catch (error) {
        console.error("Failed to update frontmatter title after rename:", error);
      }
    }
  });
  electron.ipcMain.handle("tapestry:deleteNode", async (_, nodePath) => {
    const stats = await fs__namespace.stat(nodePath);
    if (stats.isDirectory()) {
      await fs__namespace.rm(nodePath, { recursive: true, force: true });
    } else {
      await fs__namespace.unlink(nodePath);
    }
  });
  electron.ipcMain.handle("tapestry:move", async (_, sourcePath, destinationFolder, itemName) => {
    const destinationPath = path__namespace.join(destinationFolder, itemName);
    await fs__namespace.rename(sourcePath, destinationPath);
  });
  electron.ipcMain.handle("tapestry:updateOrder", async (_, folderPath, order) => {
    const loomDir = path__namespace.join(folderPath, ".loom");
    await fs__namespace.mkdir(loomDir, { recursive: true });
    const orderPath = path__namespace.join(loomDir, "order.json");
    const orderData = { entries: order };
    await fs__namespace.writeFile(orderPath, JSON.stringify(orderData, null, 2), "utf-8");
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
  setupSettingsHandlers();
  registerTapestryHandlers();
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
