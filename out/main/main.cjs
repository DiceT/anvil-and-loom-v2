"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs/promises");
const url = require("url");
const matter = require("gray-matter");
const uuid = require("uuid");
const seedrandom = require("seedrandom");
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
function getUserDataPath() {
  return electron.app.getPath("userData");
}
function getLayoutFilePath() {
  return path.join(getUserDataPath(), "layout.json");
}
function setupSettingsHandlers() {
  electron.ipcMain.handle("settings:saveLayout", async (_, layout) => {
    try {
      await fs.writeFile(getLayoutFilePath(), JSON.stringify(layout, null, 2));
      return { success: true };
    } catch (error) {
      console.error("Failed to save layout:", error);
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("settings:loadLayout", async () => {
    try {
      const data = await fs.readFile(getLayoutFilePath(), "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  });
  electron.ipcMain.handle("settings:resetLayout", async () => {
    try {
      await fs.unlink(getLayoutFilePath());
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
function getTapestriesBasePath() {
  return path__namespace.join(electron.app.getPath("documents"), "Anvil and Loom", "Tapestries");
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
    entriesDir: path__namespace.join(root, "entries"),
    imagesDir: path__namespace.join(root, ".images")
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
    if (dirent.name === ".weave") continue;
    if (dirent.name === ".images") continue;
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
    const basePath = data.basePath || getTapestriesBasePath();
    const root = path__namespace.join(basePath, slug);
    const { loomDir, entriesDir, imagesDir } = getTapestryPaths(root);
    await ensureDir(loomDir);
    await ensureDir(entriesDir);
    await ensureDir(imagesDir);
    const defaultFolders = ["Sessions", "Places", "Dungeons", "NPCs", "Factions", "Relics", "Lore", "Maps", "Others"];
    for (const folder of defaultFolders) {
      await ensureDir(path__namespace.join(entriesDir, folder));
    }
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
    const { imagesDir } = getTapestryPaths(entry.path);
    await ensureDir(imagesDir);
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
        if (dirent.name === ".weave") continue;
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
    const pickerPath = defaultPath || getTapestriesBasePath();
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
  electron.ipcMain.handle("tapestry:pickFolder", async (_event, defaultPath) => {
    const pickerPath = defaultPath || getTapestriesBasePath();
    const result = await electron.dialog.showOpenDialog({
      title: "Select Tapestry Folder",
      defaultPath: pickerPath,
      properties: ["openDirectory", "createDirectory"]
    });
    if (result.canceled || !result.filePaths?.length) {
      return null;
    }
    return result.filePaths[0];
  });
}
class SeededRNG {
  rng;
  seed;
  constructor(seed) {
    this.seed = seed ?? uuid.v4();
    this.rng = seedrandom(this.seed);
  }
  /** Returns a random float between 0 (inclusive) and 1 (exclusive) */
  random() {
    return this.rng();
  }
  /** Returns a random integer between min and max (inclusive) */
  int(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
  /** 
   * Rolls a d66 (two d6 combined as tens and ones).
   * Valid range: 11-16, 21-26, 31-36, 41-46, 51-56, 61-66
   */
  d66() {
    const tens = this.int(1, 6);
    const ones = this.int(1, 6);
    return tens * 10 + ones;
  }
  /**
   * Rolls a d88 (two d8 combined as tens and ones).
   * Valid range: 11-18, 21-28, ..., 81-88
   */
  d88() {
    const tens = this.int(1, 8);
    const ones = this.int(1, 8);
    return tens * 10 + ones;
  }
}
function getRollMode(table) {
  const tags = table.tags || [];
  const diceTag = tags.find((t) => /^(d66|d88|2d\d+)$/i.test(t));
  if (diceTag) {
    const lowerTag = diceTag.toLowerCase();
    if (lowerTag === "d66") return "d66";
    if (lowerTag === "d88") return "d88";
    if (/^2d(6|8|10|12|20)$/.test(lowerTag)) return lowerTag;
  }
  if (table.maxRoll === 66) return "d66";
  if (table.maxRoll === 88) return "d88";
  return "standard";
}
class RandomTableEngine {
  /**
   * Rolls on a table and returns the result.
   * Does NOT resolve tokens - that's a separate layer.
   */
  roll(table, options = {}) {
    const rng = new SeededRNG(options.seed);
    const warnings = [];
    const rollValue = options.rollValue ?? this.generateRollValue(rng, table);
    const matches = this.findMatchingRows(table.tableData, rollValue);
    let selectedRow = null;
    if (matches.length === 0) {
      warnings.push(`No match found for roll ${rollValue} on table "${table.name}"`);
    } else if (matches.length === 1) {
      selectedRow = matches[0];
    } else {
      warnings.push(`Multiple matches (${matches.length}) for roll ${rollValue} on table "${table.name}"`);
      const index = rng.int(0, matches.length - 1);
      selectedRow = matches[index];
    }
    return {
      seed: rng.seed,
      tableChain: [table.name],
      rolls: [rollValue],
      warnings,
      result: selectedRow?.result ?? "[NO MATCH]"
    };
  }
  generateRollValue(rng, table) {
    const mode = getRollMode(table);
    switch (mode) {
      case "d66":
        return rng.d66();
      case "d88":
        return rng.d88();
      case "2d6":
        return rng.int(1, 6) + rng.int(1, 6);
      case "2d8":
        return rng.int(1, 8) + rng.int(1, 8);
      case "2d10":
        return rng.int(1, 10) + rng.int(1, 10);
      case "2d12":
        return rng.int(1, 12) + rng.int(1, 12);
      case "2d20":
        return rng.int(1, 20) + rng.int(1, 20);
      default:
        return rng.int(1, table.maxRoll);
    }
  }
  findMatchingRows(tableData, rollValue) {
    return tableData.filter(
      (row) => rollValue >= row.floor && rollValue <= row.ceiling
    );
  }
}
const TOKEN_REGEX = /\[\[\s*([a-zA-Z0-9_\-\s]+?)\s*\]\]/g;
const MAX_DEPTH = 10;
class TokenResolver {
  onError;
  constructor(onError) {
    this.onError = onError;
  }
  /**
   * Resolves all tokens in a result value.
   * Returns: fully resolved value and merged context info.
   */
  resolve(value, rollByTag, context) {
    const ctx = {
      depth: context?.depth ?? 0,
      visitedTags: context?.visitedTags ?? /* @__PURE__ */ new Set(),
      tableChain: context?.tableChain ?? [],
      rolls: context?.rolls ?? [],
      warnings: context?.warnings ?? []
    };
    if (typeof value === "string") {
      const resolved = this.resolveString(value, rollByTag, ctx);
      return { resolved, context: ctx };
    } else {
      const resolved = this.resolveObject(value, rollByTag, ctx);
      return { resolved, context: ctx };
    }
  }
  resolveString(text, rollByTag, ctx) {
    return text.replace(TOKEN_REGEX, (_match, tag) => {
      const cleanTag = tag.trim();
      return this.resolveToken(cleanTag, rollByTag, ctx);
    });
  }
  resolveObject(obj, rollByTag, ctx) {
    const resolved = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        resolved[key] = this.resolveString(value, rollByTag, ctx);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        resolved[key] = this.resolveObject(value, rollByTag, ctx);
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }
  resolveToken(tag, rollByTag, ctx) {
    if (ctx.depth >= MAX_DEPTH) {
      const msg = `Max resolution depth (${MAX_DEPTH}) exceeded for tag "${tag}"`;
      ctx.warnings.push(msg);
      this.onError?.(msg, { tag, depth: ctx.depth });
      return `[UNRESOLVED:${tag}]`;
    }
    if (ctx.visitedTags.has(tag)) {
      const msg = `Cycle detected: tag "${tag}" already in resolution chain`;
      ctx.warnings.push(msg);
      this.onError?.(msg, { tag, chain: Array.from(ctx.visitedTags) });
      return `[CYCLE:${tag}]`;
    }
    const result = rollByTag(tag);
    if (!result) {
      const msg = `No table found for tag "${tag}"`;
      ctx.warnings.push(msg);
      this.onError?.(msg, { tag });
      return `[UNRESOLVED:${tag}]`;
    }
    if (result.rolls.length > 0) {
      ctx.rolls.push(...result.rolls);
    }
    ctx.visitedTags.add(tag);
    ctx.tableChain.push(...result.tableChain);
    ctx.warnings.push(...result.warnings);
    const childCtx = {
      depth: ctx.depth + 1,
      visitedTags: new Set(ctx.visitedTags),
      tableChain: ctx.tableChain,
      rolls: ctx.rolls,
      warnings: ctx.warnings
    };
    if (typeof result.result === "string") {
      return this.resolveString(result.result, rollByTag, childCtx);
    } else if (typeof result.result === "object" && result.result !== null && !("tag" in result.result)) {
      const resolved = this.resolveObject(result.result, rollByTag, childCtx);
      return JSON.stringify(resolved);
    } else {
      return `[${result.result.tag}]`;
    }
  }
}
let currentTapestryPath = null;
const tableCache = /* @__PURE__ */ new Map();
function getWeaveDirPath() {
  if (!currentTapestryPath) {
    throw new Error("No Tapestry path set. Call weave:setTapestryPath first.");
  }
  return path__namespace.join(currentTapestryPath, ".weave");
}
async function ensureWeaveDir() {
  const weaveDir = getWeaveDirPath();
  await fs__namespace.mkdir(weaveDir, { recursive: true });
  return weaveDir;
}
function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, " ").trim().slice(0, 64);
}
async function getUniqueFilePath(dir, name, tableId) {
  const sanitized = sanitizeFilename(name) || "Untitled-Table";
  let fileName = `${sanitized}.json`;
  let filePath = path__namespace.join(dir, fileName);
  try {
    await fs__namespace.access(filePath);
  } catch {
    return filePath;
  }
  try {
    const data = await fs__namespace.readFile(filePath, "utf-8");
    const existing = JSON.parse(data);
    if (existing.id === tableId) {
      return filePath;
    }
  } catch {
  }
  let counter = 1;
  while (true) {
    fileName = `${sanitized} (${counter}).json`;
    filePath = path__namespace.join(dir, fileName);
    try {
      await fs__namespace.access(filePath);
      try {
        const data = await fs__namespace.readFile(filePath, "utf-8");
        const existing = JSON.parse(data);
        if (existing.id === tableId) {
          return filePath;
        }
      } catch {
      }
      counter++;
    } catch {
      return filePath;
    }
  }
}
async function readTableFiles() {
  try {
    const weaveDir = getWeaveDirPath();
    const entries = await fs__namespace.readdir(weaveDir, { withFileTypes: true });
    const tables = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/i;
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        const oldPath = path__namespace.join(weaveDir, entry.name);
        try {
          const data = await fs__namespace.readFile(oldPath, "utf-8");
          const table = JSON.parse(data);
          let currentPath = oldPath;
          if (uuidRegex.test(entry.name)) {
            const newPath = await getUniqueFilePath(weaveDir, table.name, table.id);
            if (newPath !== oldPath) {
              try {
                await fs__namespace.rename(oldPath, newPath);
                currentPath = newPath;
              } catch (err) {
                console.error(`Failed to migrate table ${entry.name}`, err);
              }
            }
          }
          table.sourcePath = currentPath;
          tableCache.set(table.id, table);
          tables.push(table);
        } catch (error) {
          console.error(`Failed to read table file ${entry.name}:`, error);
        }
      }
    }
    return tables;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
async function writeTableFile(table) {
  const weaveDir = await ensureWeaveDir();
  const newPath = await getUniqueFilePath(weaveDir, table.name, table.id);
  if (table.sourcePath && table.sourcePath !== newPath) {
    try {
      await fs__namespace.access(table.sourcePath);
      await fs__namespace.unlink(table.sourcePath);
    } catch (e) {
    }
  }
  table.sourcePath = newPath;
  await fs__namespace.writeFile(newPath, JSON.stringify(table, null, 2), "utf-8");
  tableCache.set(table.id, table);
}
async function deleteTableFile(tableId) {
  const table = tableCache.get(tableId);
  if (table && table.sourcePath) {
    try {
      await fs__namespace.unlink(table.sourcePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
  tableCache.delete(tableId);
}
function findTableById(tableId) {
  return tableCache.get(tableId) ?? null;
}
function findTableByTag(tag) {
  for (const table of tableCache.values()) {
    if (table.tags.includes(tag)) {
      return table;
    }
  }
  return null;
}
function rollTable(table, resolveTokens = true) {
  const engine = new RandomTableEngine();
  const result = engine.roll(table);
  if (resolveTokens) {
    if (typeof result.result === "object" && result.result !== null && "tag" in result.result) {
      const refTag = result.result.tag;
      const refTable = findTableByTag(refTag);
      if (refTable) {
        const subResult = rollTable(refTable, true);
        return {
          seed: result.seed,
          tableChain: [table.name, ...subResult.tableChain],
          rolls: [...result.rolls, ...subResult.rolls],
          warnings: [...result.warnings, ...subResult.warnings],
          result: subResult.result
        };
      }
      return result;
    }
    const resolver = new TokenResolver();
    const resolved = resolver.resolve(result.result, (tag) => {
      const refTable = findTableByTag(tag);
      if (refTable) {
        return rollTable(refTable, true);
      }
      return null;
    });
    const allRolls = [...result.rolls, ...resolved.context.rolls];
    return {
      seed: result.seed,
      tableChain: [table.name, ...resolved.context.tableChain],
      rolls: allRolls,
      warnings: [...result.warnings, ...resolved.context.warnings],
      result: resolved.resolved
    };
  }
  return result;
}
function registerWeaveHandlers() {
  electron.ipcMain.handle("weave:setTapestryPath", async (_event, tapestryPath) => {
    try {
      await fs__namespace.access(tapestryPath);
      tableCache.clear();
      currentTapestryPath = tapestryPath;
      await ensureWeaveDir();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error?.message ?? "Failed to set Tapestry path"
      };
    }
  });
  electron.ipcMain.handle("weave:getTables", async () => {
    try {
      if (!currentTapestryPath) {
        return {
          tables: [],
          error: "No Tapestry path set. Call weave:setTapestryPath first."
        };
      }
      const tables = await readTableFiles();
      return { tables };
    } catch (error) {
      return {
        tables: [],
        error: error?.message ?? "Failed to load tables"
      };
    }
  });
  electron.ipcMain.handle("weave:getTable", async (_event, tableId) => {
    try {
      let table = findTableById(tableId);
      if (!table) {
        const weaveDir = getWeaveDirPath();
        const filePath = path__namespace.join(weaveDir, `${tableId}.json`);
        try {
          const data = await fs__namespace.readFile(filePath, "utf-8");
          table = JSON.parse(data);
          table.sourcePath = filePath;
          tableCache.set(tableId, table);
        } catch (error) {
          if (error.code === "ENOENT") {
            return {
              table: null,
              error: `Table with ID ${tableId} not found`
            };
          }
          throw error;
        }
      }
      return { table };
    } catch (error) {
      return {
        table: null,
        error: error?.message ?? "Failed to load table"
      };
    }
  });
  electron.ipcMain.handle("weave:saveTable", async (_event, table) => {
    try {
      if (!currentTapestryPath) {
        return {
          success: false,
          error: "No Tapestry path set. Call weave:setTapestryPath first."
        };
      }
      if (!table.id) {
        table.id = uuid.v4();
      }
      if (!table.schemaVersion) {
        table.schemaVersion = 1;
      }
      await writeTableFile(table);
      return { success: true, table };
    } catch (error) {
      return {
        success: false,
        error: error?.message ?? "Failed to save table"
      };
    }
  });
  electron.ipcMain.handle("weave:deleteTable", async (_event, tableId) => {
    try {
      if (!currentTapestryPath) {
        return {
          success: false,
          error: "No Tapestry path set. Call weave:setTapestryPath first."
        };
      }
      await deleteTableFile(tableId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error?.message ?? "Failed to delete table"
      };
    }
  });
  electron.ipcMain.handle("weave:rollTable", async (_event, tableId, seed) => {
    try {
      if (!currentTapestryPath) {
        return {
          result: null,
          error: "No Tapestry path set. Call weave:setTapestryPath first."
        };
      }
      const table = findTableById(tableId);
      if (!table) {
        return {
          result: null,
          error: `Table with ID ${tableId} not found`
        };
      }
      const options = {};
      if (seed) {
        options.seed = seed;
      }
      const result = rollTable(table, true);
      return { result };
    } catch (error) {
      return {
        result: null,
        error: error?.message ?? "Failed to roll table"
      };
    }
  });
}
electron.protocol.registerSchemesAsPrivileged([
  { scheme: "media", privileges: { secure: true, supportFetchAPI: true, standard: true, bypassCSP: true, stream: true } }
]);
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
      nodeIntegration: false,
      webSecurity: true
      // explicit default
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
  setupSettingsHandlers();
  registerTapestryHandlers();
  registerWeaveHandlers();
  electron.protocol.handle("media", async (request) => {
    try {
      const parsedUrl = new URL(request.url);
      let filePath = "";
      if (parsedUrl.hostname && parsedUrl.hostname.length === 1 && process.platform === "win32") {
        filePath = `${parsedUrl.hostname}:${parsedUrl.pathname}`;
      } else {
        filePath = parsedUrl.pathname;
        if (process.platform === "win32" && /^\/[a-zA-Z]:/.test(filePath)) {
          filePath = filePath.slice(1);
        }
      }
      const decodedPath = decodeURIComponent(filePath);
      console.log("[media-protocol] Request:", request.url);
      console.log("[media-protocol] Decoded:", decodedPath);
      const buffer = await fs__namespace.readFile(decodedPath);
      const ext = path.extname(decodedPath).toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === ".png") mimeType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".gif") mimeType = "image/gif";
      else if (ext === ".svg") mimeType = "image/svg+xml";
      return new Response(buffer, {
        headers: {
          "content-type": mimeType,
          "cache-control": "public, max-age=3600"
        }
      });
    } catch (error) {
      console.error("[media-protocol] Failed:", request.url, error);
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
