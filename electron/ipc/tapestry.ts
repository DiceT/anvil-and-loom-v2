import { ipcMain, app, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import type {
    TapestryRegistry,
    TapestryRegistryEntry,
    TapestryConfig,
    TapestryNode,
    EntryDoc,
    EntryFrontmatter,
    CreateTapestryData,
    UpdateTapestryData,
    FolderOrder,
} from '../../src/types/tapestry';

const REGISTRY_FILE = 'tapestries.json';

function getRegistryFilePath(): string {
    return path.join(app.getPath('userData'), REGISTRY_FILE);
}

async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as T;
    } catch (error: any) {
        if (error && error.code === 'ENOENT') {
            return defaultValue;
        }
        throw error;
    }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function readRegistry(): Promise<TapestryRegistry> {
    const filePath = getRegistryFilePath();
    return readJsonFile<TapestryRegistry>(filePath, { tapestries: [] });
}

async function writeRegistry(registry: TapestryRegistry): Promise<void> {
    const filePath = getRegistryFilePath();
    await writeJsonFile(filePath, registry);
}

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'tapestry';
}

async function ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
}

function getTapestryPaths(root: string) {
    const loomDir = path.join(root, '.loom');
    return {
        loomDir,
        configPath: path.join(loomDir, 'tapestry.json'),
        entriesDir: path.join(root, 'entries'),
    };
}

async function loadTapestryConfig(root: string): Promise<TapestryConfig | null> {
    const { configPath } = getTapestryPaths(root);
    try {
        const data = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(data) as TapestryConfig;
    } catch (error: any) {
        if (error && error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

async function saveTapestryConfig(root: string, config: TapestryConfig): Promise<void> {
    const { loomDir, configPath } = getTapestryPaths(root);
    await ensureDir(loomDir);
    await writeJsonFile(configPath, config);
}

async function ensureFrontmatterId(filePath: string, frontmatter: EntryFrontmatter, content: string): Promise<EntryFrontmatter> {
    if (frontmatter.id) {
        return frontmatter;
    }
    const updated: EntryFrontmatter = {
        ...frontmatter,
        id: uuidv4(),
    };
    const full = matter.stringify(content, updated);
    await fs.writeFile(filePath, full, 'utf-8');
    return updated;
}

async function loadEntryDoc(filePath: string): Promise<EntryDoc | null> {
    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(raw);
        const fm = parsed.data as EntryFrontmatter;
        const frontmatter = await ensureFrontmatterId(filePath, fm, parsed.content);
        const title = frontmatter.title || path.basename(filePath, path.extname(filePath));
        return {
            id: frontmatter.id,
            path: filePath,
            title,
            category: frontmatter.category,
            content: parsed.content,
            frontmatter,
            isDirty: false,
        };
    } catch (error: any) {
        if (error && error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

async function saveEntryDoc(doc: EntryDoc): Promise<void> {
    const full = matter.stringify(doc.content, doc.frontmatter);
    await fs.writeFile(doc.path, full, 'utf-8');
}

async function readFolderOrder(folderPath: string): Promise<FolderOrder | null> {
    const orderPath = path.join(folderPath, '.loom', 'order.json');
    try {
        const data = await fs.readFile(orderPath, 'utf-8');
        return JSON.parse(data) as FolderOrder;
    } catch (error: any) {
        if (error && error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

async function writeFolderOrder(folderPath: string, order: FolderOrder): Promise<void> {
    const loomDir = path.join(folderPath, '.loom');
    await ensureDir(loomDir);
    const orderPath = path.join(loomDir, 'order.json');
    await writeJsonFile(orderPath, order);
}

function sortNodesByOrder(nodes: TapestryNode[], order: FolderOrder | null): TapestryNode[] {
    if (!order || !order.entries?.length) {
        return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
    }

    const byName = new Map(nodes.map((node) => [path.basename(node.path), node]));
    const ordered: TapestryNode[] = [];

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

async function buildFolderTree(folderPath: string): Promise<TapestryNode[]> {
    const dirents = await fs.readdir(folderPath, { withFileTypes: true });
    const nodes: TapestryNode[] = [];

    for (const dirent of dirents) {
        if (dirent.name === '.loom') continue;

        const fullPath = path.join(folderPath, dirent.name);

        if (dirent.isDirectory()) {
            const children = await buildFolderTree(fullPath);
            nodes.push({
                id: fullPath,
                type: 'folder',
                name: dirent.name,
                path: fullPath,
                children,
            });
        } else if (dirent.isFile()) {
            const ext = path.extname(dirent.name).toLowerCase();
            if (ext === '.md') {
                const doc = await loadEntryDoc(fullPath);
                if (doc) {
                    nodes.push({
                        id: doc.id,
                        type: 'entry',
                        name: doc.title,
                        path: fullPath,
                        category: doc.category,
                        tags: doc.frontmatter.tags,
                    });
                }
            } else {
                nodes.push({
                    id: fullPath,
                    type: 'asset',
                    name: dirent.name,
                    path: fullPath,
                });
            }
        }
    }

    const order = await readFolderOrder(folderPath);
    return sortNodesByOrder(nodes, order);
}

async function buildTapestryTree(root: string): Promise<TapestryNode | null> {
    const { entriesDir } = getTapestryPaths(root);
    try {
        const children = await buildFolderTree(entriesDir);
        return {
            id: entriesDir,
            type: 'folder',
            name: 'entries',
            path: entriesDir,
            children,
        };
    } catch (error: any) {
        if (error && error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

async function deletePath(targetPath: string): Promise<void> {
    await fs.rm(targetPath, { recursive: true, force: true });
}

export function registerTapestryHandlers() {
    // Registry: load all tapestries
    ipcMain.handle('tapestry:loadRegistry', async () => {
        return readRegistry();
    });

    // Create a new tapestry
    ipcMain.handle('tapestry:create', async (_event, data: CreateTapestryData) => {
        const registry = await readRegistry();

        const id = uuidv4();
        const slug = slugify(data.name);
        const basePath =
            data.basePath || path.join(app.getPath('documents'), 'Anvil and Loom', 'Tapestries');
        const root = path.join(basePath, slug);

        const { loomDir, entriesDir } = getTapestryPaths(root);
        await ensureDir(loomDir);
        await ensureDir(entriesDir);

        // Create Default Folders
        const defaultFolders = ['Sessions', 'Places', 'People', 'Lore', 'World', 'Mechanics', 'Maps'];
        for (const folder of defaultFolders) {
            await ensureDir(path.join(entriesDir, folder));
        }

        const createdAt = new Date().toISOString();

        const config: TapestryConfig = {
            id,
            name: data.name,
            description: data.description,
            imagePath: data.imagePath,
            defaultEntryCategory: 'session',
        };

        await saveTapestryConfig(root, config);

        // Seed initial panel entry
        const firstEntryId = uuidv4();
        const firstEntryFrontmatter: EntryFrontmatter = {
            id: firstEntryId,
            title: 'The First Thread',
            category: config.defaultEntryCategory || 'session',
            tags: ['intro'],
        };

        const initialContent =
            `Welcome to your new Tapestry. This is your first Panel.
Roll some dice or pull on The Weave, then write your first Thread of the story.`;

        const firstEntryMarkdown = matter.stringify(initialContent, firstEntryFrontmatter);
        const firstEntryPath = path.join(entriesDir, 'The First Thread.md');
        await fs.writeFile(firstEntryPath, firstEntryMarkdown, 'utf-8');

        const registryEntry: TapestryRegistryEntry = {
            id,
            name: data.name,
            path: root,
            description: data.description,
            imagePath: data.imagePath,
            createdAt,
            updatedAt: createdAt,
            lastOpenedAt: createdAt,
        };

        registry.tapestries.push(registryEntry);
        await writeRegistry(registry);

        return id;
    });

    // Open tapestry (load config and update lastOpenedAt)
    ipcMain.handle('tapestry:open', async (_event, id: string) => {
        const registry = await readRegistry();
        const entry = registry.tapestries.find((t) => t.id === id);
        if (!entry) return null;

        const config = await loadTapestryConfig(entry.path);
        const now = new Date().toISOString();
        entry.lastOpenedAt = now;
        entry.updatedAt = now;
        await writeRegistry(registry);

        return config;
    });

    // Update tapestry metadata
    ipcMain.handle('tapestry:update', async (_event, id: string, updates: UpdateTapestryData) => {
        const registry = await readRegistry();
        const entry = registry.tapestries.find((t) => t.id === id);
        if (!entry) return;

        const oldPath = entry.path;
        const nameChanged = updates.name && updates.name !== entry.name;

        // Update registry entry
        entry.name = updates.name ?? entry.name;
        entry.description = updates.description ?? entry.description;
        entry.imagePath = updates.imagePath ?? entry.imagePath;
        entry.updatedAt = new Date().toISOString();

        // If name changed, rename the directory
        if (nameChanged) {
            const parentDir = path.dirname(oldPath);
            const newSlug = slugify(entry.name);
            let newPath = path.join(parentDir, newSlug);

            // Handle conflicts - if directory exists, append number
            let counter = 2;
            while (true) {
                try {
                    await fs.access(newPath);
                    // Directory exists, try with counter
                    newPath = path.join(parentDir, `${newSlug}-${counter}`);
                    counter++;
                } catch {
                    // Directory doesn't exist, we can use this path
                    break;
                }
            }

            // Rename the directory
            try {
                await fs.rename(oldPath, newPath);
                entry.path = newPath;
                console.log(`[tapestry:update] Renamed directory: ${oldPath} → ${newPath}`);
            } catch (error) {
                console.error('[tapestry:update] Failed to rename directory:', error);
                // Continue anyway - the metadata is still updated
            }
        }

        await writeRegistry(registry);

        // Update the tapestry config file
        const config = await loadTapestryConfig(entry.path);
        if (config) {
            const newConfig: TapestryConfig = {
                ...config,
                name: entry.name,
                description: entry.description,
                imagePath: entry.imagePath,
            };
            await saveTapestryConfig(entry.path, newConfig);
        }
    });

    // Remove from registry (keep files on disk)
    ipcMain.handle('tapestry:remove', async (_event, id: string) => {
        const registry = await readRegistry();
        registry.tapestries = registry.tapestries.filter((t) => t.id !== id);
        await writeRegistry(registry);
    });

    // Delete tapestry from disk
    ipcMain.handle('tapestry:delete', async (_event, id: string) => {
        const registry = await readRegistry();
        const entry = registry.tapestries.find((t) => t.id === id);
        if (entry) {
            await deletePath(entry.path);
        }
        registry.tapestries = registry.tapestries.filter((t) => t.id !== id);
        await writeRegistry(registry);
    });

    // Load tapestry tree
    ipcMain.handle('tapestry:loadTree', async (_event, tapestryId: string) => {
        const registry = await readRegistry();
        const entry = registry.tapestries.find((t) => t.id === tapestryId);
        if (!entry) return null;
        return buildTapestryTree(entry.path);
    });

    // Load a single entry
    ipcMain.handle('tapestry:loadEntry', async (_event, entryPath: string) => {
        return loadEntryDoc(entryPath);
    });

    // Save an entry
    ipcMain.handle('tapestry:saveEntry', async (_event, entry: EntryDoc) => {
        await saveEntryDoc(entry);
    });

    // Create a new entry under a folder
    ipcMain.handle(
        'tapestry:createEntry',
        async (_event, parentPath: string, title: string, category: string) => {
            await ensureDir(parentPath);
            const safeTitle = title.trim() || 'Untitled Panel';
            const slug = slugify(safeTitle);
            let fileName = `${slug}.md`;
            let targetPath = path.join(parentPath, fileName);

            // Ensure unique filename
            let counter = 1;
            while (true) {
                try {
                    await fs.access(targetPath);
                    counter += 1;
                    fileName = `${slug}-${counter}.md`;
                    targetPath = path.join(parentPath, fileName);
                } catch {
                    break;
                }
            }

            const id = uuidv4();
            const frontmatter: EntryFrontmatter = {
                id,
                title: safeTitle,
                category: category as EntryFrontmatter['category'],
            };

            const content = '\n';
            const markdown = matter.stringify(content, frontmatter);
            await fs.writeFile(targetPath, markdown, 'utf-8');

            // Optionally update folder order
            const currentOrder = (await readFolderOrder(parentPath)) ?? { entries: [] };
            currentOrder.entries.push(fileName);
            await writeFolderOrder(parentPath, currentOrder);

            await writeFolderOrder(parentPath, currentOrder);

            return { id, path: targetPath };
        },
    );

    // Create a folder
    ipcMain.handle('tapestry:createFolder', async (_event, parentPath: string, name: string) => {
        const folderPath = path.join(parentPath, name);
        await ensureDir(folderPath);

        const currentOrder = (await readFolderOrder(parentPath)) ?? { entries: [] };
        if (!currentOrder.entries.includes(name)) {
            currentOrder.entries.push(name);
            await writeFolderOrder(parentPath, currentOrder);
        }
    });

    // Rename entry or folder
    ipcMain.handle('tapestry:rename', async (_event, oldPath: string, newName: string) => {
        const parentDir = path.dirname(oldPath);
        const ext = path.extname(oldPath);
        const isFile = !!ext;
        const newPath = path.join(parentDir, isFile ? `${newName}${ext}` : newName);

        await fs.rename(oldPath, newPath);

        // If it's a markdown entry, update its frontmatter title
        if (isFile && ext.toLowerCase() === '.md') {
            const doc = await loadEntryDoc(newPath);
            if (doc) {
                doc.frontmatter.title = newName;
                doc.title = newName;
                await saveEntryDoc(doc);
            }
        }

        // Update folder order to reflect new name
        const order = (await readFolderOrder(parentDir)) ?? { entries: [] };
        const baseOld = path.basename(oldPath);
        const baseNew = path.basename(newPath);
        order.entries = order.entries.map((e) => (e === baseOld ? baseNew : e));
        await writeFolderOrder(parentDir, order);
        return newPath;
    });

    // Delete entry or folder
    ipcMain.handle('tapestry:deleteNode', async (_event, targetPath: string) => {
        const parentDir = path.dirname(targetPath);
        await deletePath(targetPath);

        const order = (await readFolderOrder(parentDir)) ?? { entries: [] };
        const base = path.basename(targetPath);
        order.entries = order.entries.filter((e) => e !== base);
        await writeFolderOrder(parentDir, order);
    });

    // Move entry or folder
    ipcMain.handle(
        'tapestry:move',
        async (_event, sourcePath: string, destinationFolder: string, itemName: string) => {
            await ensureDir(destinationFolder);
            const targetPath = path.join(destinationFolder, itemName);
            await fs.rename(sourcePath, targetPath);

            const sourceParent = path.dirname(sourcePath);
            const sourceOrder = (await readFolderOrder(sourceParent)) ?? { entries: [] };
            const baseSource = path.basename(sourcePath);
            sourceOrder.entries = sourceOrder.entries.filter((e) => e !== baseSource);
            await writeFolderOrder(sourceParent, sourceOrder);

            const destOrder = (await readFolderOrder(destinationFolder)) ?? { entries: [] };
            if (!destOrder.entries.includes(itemName)) {
                destOrder.entries.push(itemName);
                await writeFolderOrder(destinationFolder, destOrder);
            }
        },
    );

    // Update custom order for a folder
    ipcMain.handle(
        'tapestry:updateOrder',
        async (_event, folderPath: string, order: string[]) => {
            const folderOrder: FolderOrder = { entries: order };
            await writeFolderOrder(folderPath, folderOrder);
        },
    );

    // Get all panels for indexing
    ipcMain.handle('tapestry:getAllPanels', async (_event, tapestryId: string) => {
        const registry = await readRegistry();
        const entry = registry.tapestries.find((t) => t.id === tapestryId);
        if (!entry) return [];

        const { entriesDir } = getTapestryPaths(entry.path);

        async function getMarkdownFiles(dir: string): Promise<Array<{ id: string; title: string; content: string; path: string }>> {
            const dirents = await fs.readdir(dir, { withFileTypes: true });
            const files: Array<{ id: string; title: string; content: string; path: string }> = [];

            for (const dirent of dirents) {
                if (dirent.name === '.loom') continue;
                const fullPath = path.join(dir, dirent.name);

                if (dirent.isDirectory()) {
                    files.push(...(await getMarkdownFiles(fullPath)));
                } else if (dirent.isFile() && path.extname(dirent.name).toLowerCase() === '.md') {
                    const doc = await loadEntryDoc(fullPath);
                    if (doc) {
                        files.push({
                            id: doc.id,
                            title: doc.title,
                            content: doc.content,
                            path: doc.path,
                        });
                    }
                }
            }
            return files;
        }

        try {
            return await getMarkdownFiles(entriesDir);
        } catch (error) {
            console.error('Failed to get all entries:', error);
            return [];
        }
    });

    // Image picker for tapestry artwork
    ipcMain.handle('tapestry:pickImage', async (_event, defaultPath?: string) => {
        // If no path provided, use the Tapestries root folder
        const pickerPath = defaultPath || path.join(app.getPath('documents'), 'Anvil and Loom', 'Tapestries');

        const result = await dialog.showOpenDialog({
            title: 'Select Tapestry Image',
            defaultPath: pickerPath,
            properties: ['openFile'],
            filters: [
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });

        if (result.canceled || !result.filePaths?.length) {
            return null;
        }

        return result.filePaths[0];
    });
}
