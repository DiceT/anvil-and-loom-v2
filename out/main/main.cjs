"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
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
  const [
    coreAspects,
    coreDomains,
    coreOracles,
    coreOraclesMore,
    userAspects,
    userDomains,
    userOracles,
    userOraclesMore
  ] = await Promise.all([
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, "aspects")),
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, "domains")),
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, "oracles")),
    loadJsonFilesFromDirectory(path.join(CORE_TABLES_DIR, "oracles", "more")),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), "aspects")),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), "domains")),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), "oracles")),
    loadJsonFilesFromDirectory(path.join(getUserDataDir(), "oracles", "more"))
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
      coreMore: coreOraclesMore,
      user: userOracles,
      userMore: userOraclesMore
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
  electron.ipcMain.handle("tables:saveForgeFile", async (event, { category, filename, data }) => {
    try {
      const { dialog, BrowserWindow } = await import("electron");
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) {
        return { success: false, error: "Window not found" };
      }
      const result = await dialog.showSaveDialog(win, {
        title: "Save Table Forge File",
        defaultPath: `${filename}.json`,
        filters: [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] }
        ]
      });
      if (result.canceled || !result.filePath) {
        return { success: false, error: "Save cancelled" };
      }
      await fs.writeFile(result.filePath, JSON.stringify(data, null, 2), "utf-8");
      return { success: true, path: result.filePath };
    } catch (error) {
      console.error("Failed to save forge file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
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
function getRegistryFilePath() {
  return path__namespace.join(electron.app.getPath("userData"), REGISTRY_FILE);
}
async function readJsonFile(filePath, defaultValue) {
  try {
    const data = await fs__namespace.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return defaultValue;
    }
    throw error;
  }
}
async function writeJsonFile(filePath, data) {
  await fs__namespace.mkdir(path__namespace.dirname(filePath), { recursive: true });
  await fs__namespace.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
async function readRegistry() {
  const filePath = getRegistryFilePath();
  return readJsonFile(filePath, { tapestries: [] });
}
async function writeRegistry(registry) {
  const filePath = getRegistryFilePath();
  await writeJsonFile(filePath, registry);
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tapestry";
}
async function ensureDir(dirPath) {
  await fs__namespace.mkdir(dirPath, { recursive: true });
}
function getTapestryPaths(root) {
  const loomDir = path__namespace.join(root, ".loom");
  return {
    loomDir,
    configPath: path__namespace.join(loomDir, "tapestry.json"),
    entriesDir: path__namespace.join(root, "entries")
  };
}
async function loadTapestryConfig(root) {
  const { configPath } = getTapestryPaths(root);
  try {
    const data = await fs__namespace.readFile(configPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
async function saveTapestryConfig(root, config) {
  const { loomDir, configPath } = getTapestryPaths(root);
  await ensureDir(loomDir);
  await writeJsonFile(configPath, config);
}
async function ensureFrontmatterId(filePath, frontmatter, content) {
  if (frontmatter.id) {
    return frontmatter;
  }
  const updated = {
    ...frontmatter,
    id: uuid.v4()
  };
  const full = matter.stringify(content, updated);
  await fs__namespace.writeFile(filePath, full, "utf-8");
  return updated;
}
async function loadEntryDoc(filePath) {
  try {
    const raw = await fs__namespace.readFile(filePath, "utf-8");
    const parsed = matter(raw);
    const fm = parsed.data;
    const frontmatter = await ensureFrontmatterId(filePath, fm, parsed.content);
    const title = frontmatter.title || path__namespace.basename(filePath, path__namespace.extname(filePath));
    return {
      id: frontmatter.id,
      path: filePath,
      title,
      category: frontmatter.category,
      content: parsed.content,
      frontmatter,
      isDirty: false
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
async function saveEntryDoc(doc) {
  const full = matter.stringify(doc.content, doc.frontmatter);
  await fs__namespace.writeFile(doc.path, full, "utf-8");
}
async function readFolderOrder(folderPath) {
  const orderPath = path__namespace.join(folderPath, ".loom", "order.json");
  try {
    const data = await fs__namespace.readFile(orderPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
async function writeFolderOrder(folderPath, order) {
  const loomDir = path__namespace.join(folderPath, ".loom");
  await ensureDir(loomDir);
  const orderPath = path__namespace.join(loomDir, "order.json");
  await writeJsonFile(orderPath, order);
}
function sortNodesByOrder(nodes, order) {
  if (!order || !order.entries?.length) {
    return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
  }
  const byName = new Map(nodes.map((node) => [path__namespace.basename(node.path), node]));
  const ordered = [];
  for (const name of order.entries) {
    const node = byName.get(name);
    if (node) {
      ordered.push(node);
    }
  }
  const remaining = nodes.filter((n) => !ordered.includes(n));
  remaining.sort((a, b) => a.name.localeCompare(b.name));
  return [...ordered, ...remaining];
}
async function buildFolderTree(folderPath) {
  const dirents = await fs__namespace.readdir(folderPath, { withFileTypes: true });
  const nodes = [];
  for (const dirent of dirents) {
    if (dirent.name === ".loom") continue;
    const fullPath = path__namespace.join(folderPath, dirent.name);
    if (dirent.isDirectory()) {
      const children = await buildFolderTree(fullPath);
      nodes.push({
        id: fullPath,
        type: "folder",
        name: dirent.name,
        path: fullPath,
        children
      });
    } else if (dirent.isFile()) {
      const ext = path__namespace.extname(dirent.name).toLowerCase();
      if (ext === ".md") {
        const doc = await loadEntryDoc(fullPath);
        if (doc) {
          nodes.push({
            id: doc.id,
            type: "entry",
            name: doc.title,
            path: fullPath,
            category: doc.category,
            tags: doc.frontmatter.tags
          });
        }
      } else {
        nodes.push({
          id: fullPath,
          type: "asset",
          name: dirent.name,
          path: fullPath
        });
      }
    }
  }
  const order = await readFolderOrder(folderPath);
  return sortNodesByOrder(nodes, order);
}
async function buildTapestryTree(root) {
  const { entriesDir } = getTapestryPaths(root);
  try {
    const children = await buildFolderTree(entriesDir);
    return {
      id: entriesDir,
      type: "folder",
      name: "entries",
      path: entriesDir,
      children
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
async function deletePath(targetPath) {
  await fs__namespace.rm(targetPath, { recursive: true, force: true });
}
function registerTapestryHandlers() {
  electron.ipcMain.handle("tapestry:loadRegistry", async () => {
    return readRegistry();
  });
  electron.ipcMain.handle("tapestry:create", async (_event, data) => {
    const registry = await readRegistry();
    const id = uuid.v4();
    const slug = slugify(data.name);
    const basePath = data.basePath || path__namespace.join(electron.app.getPath("documents"), "Anvil and Loom", "Tapestries");
    const root = path__namespace.join(basePath, slug);
    const { loomDir, entriesDir } = getTapestryPaths(root);
    await ensureDir(loomDir);
    await ensureDir(entriesDir);
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const config = {
      id,
      name: data.name,
      description: data.description,
      imagePath: data.imagePath,
      defaultEntryCategory: "session"
    };
    await saveTapestryConfig(root, config);
    const firstEntryId = uuid.v4();
    const firstEntryFrontmatter = {
      id: firstEntryId,
      title: "The First Thread",
      category: config.defaultEntryCategory || "session",
      tags: ["intro"]
    };
    const initialContent = `Welcome to your new Tapestry. This is your first Panel.
Roll some dice or pull on The Weave, then write your first Thread of the story.`;
    const firstEntryMarkdown = matter.stringify(initialContent, firstEntryFrontmatter);
    const firstEntryPath = path__namespace.join(entriesDir, "The First Thread.md");
    await fs__namespace.writeFile(firstEntryPath, firstEntryMarkdown, "utf-8");
    const registryEntry = {
      id,
      name: data.name,
      path: root,
      description: data.description,
      imagePath: data.imagePath,
      createdAt,
      updatedAt: createdAt,
      lastOpenedAt: createdAt
    };
    registry.tapestries.push(registryEntry);
    await writeRegistry(registry);
    return id;
  });
  electron.ipcMain.handle("tapestry:open", async (_event, id) => {
    const registry = await readRegistry();
    const entry = registry.tapestries.find((t) => t.id === id);
    if (!entry) return null;
    const config = await loadTapestryConfig(entry.path);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    entry.lastOpenedAt = now;
    entry.updatedAt = now;
    await writeRegistry(registry);
    return config;
  });
  electron.ipcMain.handle("tapestry:update", async (_event, id, updates) => {
    const registry = await readRegistry();
    const entry = registry.tapestries.find((t) => t.id === id);
    if (!entry) return;
    const oldPath = entry.path;
    const nameChanged = updates.name && updates.name !== entry.name;
    entry.name = updates.name ?? entry.name;
    entry.description = updates.description ?? entry.description;
    entry.imagePath = updates.imagePath ?? entry.imagePath;
    entry.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (nameChanged) {
      const parentDir = path__namespace.dirname(oldPath);
      const newSlug = slugify(entry.name);
      let newPath = path__namespace.join(parentDir, newSlug);
      let counter = 2;
      while (true) {
        try {
          await fs__namespace.access(newPath);
          newPath = path__namespace.join(parentDir, `${newSlug}-${counter}`);
          counter++;
        } catch {
          break;
        }
      }
      try {
        await fs__namespace.rename(oldPath, newPath);
        entry.path = newPath;
        console.log(`[tapestry:update] Renamed directory: ${oldPath} → ${newPath}`);
      } catch (error) {
        console.error("[tapestry:update] Failed to rename directory:", error);
      }
    }
    await writeRegistry(registry);
    const config = await loadTapestryConfig(entry.path);
    if (config) {
      const newConfig = {
        ...config,
        name: entry.name,
        description: entry.description,
        imagePath: entry.imagePath
      };
      await saveTapestryConfig(entry.path, newConfig);
    }
  });
  electron.ipcMain.handle("tapestry:remove", async (_event, id) => {
    const registry = await readRegistry();
    registry.tapestries = registry.tapestries.filter((t) => t.id !== id);
    await writeRegistry(registry);
  });
  electron.ipcMain.handle("tapestry:delete", async (_event, id) => {
    const registry = await readRegistry();
    const entry = registry.tapestries.find((t) => t.id === id);
    if (entry) {
      await deletePath(entry.path);
    }
    registry.tapestries = registry.tapestries.filter((t) => t.id !== id);
    await writeRegistry(registry);
  });
  electron.ipcMain.handle("tapestry:loadTree", async (_event, tapestryId) => {
    const registry = await readRegistry();
    const entry = registry.tapestries.find((t) => t.id === tapestryId);
    if (!entry) return null;
    return buildTapestryTree(entry.path);
  });
  electron.ipcMain.handle("tapestry:loadEntry", async (_event, entryPath) => {
    return loadEntryDoc(entryPath);
  });
  electron.ipcMain.handle("tapestry:saveEntry", async (_event, entry) => {
    await saveEntryDoc(entry);
  });
  electron.ipcMain.handle(
    "tapestry:createEntry",
    async (_event, parentPath, title, category) => {
      await ensureDir(parentPath);
      const safeTitle = title.trim() || "Untitled Panel";
      const slug = slugify(safeTitle);
      let fileName = `${slug}.md`;
      let targetPath = path__namespace.join(parentPath, fileName);
      let counter = 1;
      while (true) {
        try {
          await fs__namespace.access(targetPath);
          counter += 1;
          fileName = `${slug}-${counter}.md`;
          targetPath = path__namespace.join(parentPath, fileName);
        } catch {
          break;
        }
      }
      const id = uuid.v4();
      const frontmatter = {
        id,
        title: safeTitle,
        category
      };
      const content = "\n";
      const markdown = matter.stringify(content, frontmatter);
      await fs__namespace.writeFile(targetPath, markdown, "utf-8");
      const currentOrder = await readFolderOrder(parentPath) ?? { entries: [] };
      currentOrder.entries.push(fileName);
      await writeFolderOrder(parentPath, currentOrder);
      await writeFolderOrder(parentPath, currentOrder);
      return { id, path: targetPath };
    }
  );
  electron.ipcMain.handle("tapestry:createFolder", async (_event, parentPath, name) => {
    const folderPath = path__namespace.join(parentPath, name);
    await ensureDir(folderPath);
    const currentOrder = await readFolderOrder(parentPath) ?? { entries: [] };
    if (!currentOrder.entries.includes(name)) {
      currentOrder.entries.push(name);
      await writeFolderOrder(parentPath, currentOrder);
    }
  });
  electron.ipcMain.handle("tapestry:rename", async (_event, oldPath, newName) => {
    const parentDir = path__namespace.dirname(oldPath);
    const ext = path__namespace.extname(oldPath);
    const isFile = !!ext;
    const newPath = path__namespace.join(parentDir, isFile ? `${newName}${ext}` : newName);
    await fs__namespace.rename(oldPath, newPath);
    if (isFile && ext.toLowerCase() === ".md") {
      const doc = await loadEntryDoc(newPath);
      if (doc) {
        doc.frontmatter.title = newName;
        doc.title = newName;
        await saveEntryDoc(doc);
      }
    }
    const order = await readFolderOrder(parentDir) ?? { entries: [] };
    const baseOld = path__namespace.basename(oldPath);
    const baseNew = path__namespace.basename(newPath);
    order.entries = order.entries.map((e) => e === baseOld ? baseNew : e);
    await writeFolderOrder(parentDir, order);
    return newPath;
  });
  electron.ipcMain.handle("tapestry:deleteNode", async (_event, targetPath) => {
    const parentDir = path__namespace.dirname(targetPath);
    await deletePath(targetPath);
    const order = await readFolderOrder(parentDir) ?? { entries: [] };
    const base = path__namespace.basename(targetPath);
    order.entries = order.entries.filter((e) => e !== base);
    await writeFolderOrder(parentDir, order);
  });
  electron.ipcMain.handle(
    "tapestry:move",
    async (_event, sourcePath, destinationFolder, itemName) => {
      await ensureDir(destinationFolder);
      const targetPath = path__namespace.join(destinationFolder, itemName);
      await fs__namespace.rename(sourcePath, targetPath);
      const sourceParent = path__namespace.dirname(sourcePath);
      const sourceOrder = await readFolderOrder(sourceParent) ?? { entries: [] };
      const baseSource = path__namespace.basename(sourcePath);
      sourceOrder.entries = sourceOrder.entries.filter((e) => e !== baseSource);
      await writeFolderOrder(sourceParent, sourceOrder);
      const destOrder = await readFolderOrder(destinationFolder) ?? { entries: [] };
      if (!destOrder.entries.includes(itemName)) {
        destOrder.entries.push(itemName);
        await writeFolderOrder(destinationFolder, destOrder);
      }
    }
  );
  electron.ipcMain.handle(
    "tapestry:updateOrder",
    async (_event, folderPath, order) => {
      const folderOrder = { entries: order };
      await writeFolderOrder(folderPath, folderOrder);
    }
  );
  electron.ipcMain.handle("tapestry:getAllPanels", async (_event, tapestryId) => {
    const registry = await readRegistry();
    const entry = registry.tapestries.find((t) => t.id === tapestryId);
    if (!entry) return [];
    const { entriesDir } = getTapestryPaths(entry.path);
    async function getMarkdownFiles(dir) {
      const dirents = await fs__namespace.readdir(dir, { withFileTypes: true });
      const files = [];
      for (const dirent of dirents) {
        if (dirent.name === ".loom") continue;
        const fullPath = path__namespace.join(dir, dirent.name);
        if (dirent.isDirectory()) {
          files.push(...await getMarkdownFiles(fullPath));
        } else if (dirent.isFile() && path__namespace.extname(dirent.name).toLowerCase() === ".md") {
          const doc = await loadEntryDoc(fullPath);
          if (doc) {
            files.push({
              id: doc.id,
              title: doc.title,
              content: doc.content,
              path: doc.path
            });
          }
        }
      }
      return files;
    }
    try {
      return await getMarkdownFiles(entriesDir);
    } catch (error) {
      console.error("Failed to get all entries:", error);
      return [];
    }
  });
  electron.ipcMain.handle("tapestry:pickImage", async (_event, defaultPath) => {
    const pickerPath = defaultPath || path__namespace.join(electron.app.getPath("documents"), "Anvil and Loom", "Tapestries");
    const result = await electron.dialog.showOpenDialog({
      title: "Select Tapestry Image",
      defaultPath: pickerPath,
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (result.canceled || !result.filePaths?.length) {
      return null;
    }
    return result.filePaths[0];
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
  electron.session.defaultSession.protocol.handle("media", async (request) => {
    let filePath = request.url.replace("media://", "");
    if (filePath.startsWith("/") && filePath.length > 2 && filePath[2] === ":") {
      filePath = filePath.substring(1);
    }
    try {
      filePath = decodeURIComponent(filePath);
    } catch (e) {
      console.error("[media protocol] Failed to decode path:", filePath, e);
    }
    if (filePath.endsWith("/")) {
      filePath = filePath.slice(0, -1);
    }
    console.log("[media protocol] Attempting to load:", filePath);
    try {
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp"
      };
      const contentType = mimeTypes[ext] || "application/octet-stream";
      console.log("[media protocol] Successfully loaded:", filePath);
      return new Response(data, {
        headers: { "Content-Type": contentType }
      });
    } catch (error) {
      console.error("[media protocol] Failed to read file:", filePath, error);
      return new Response("Not Found", { status: 404 });
    }
  });
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
