import { ipcMain, app, dialog } from 'electron';
import * as fs from 'fs/promises';
import { Dirent } from 'fs';
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
    NodeType,
} from '../../src/types/tapestry';

const REGISTRY_FILE = 'tapestries.json';

// Get registry file path
function getRegistryPath(): string {
    return path.join(app.getPath('userData'), REGISTRY_FILE);
}

// Load registry from disk
async function loadRegistry(): Promise<TapestryRegistry> {
    const registryPath = getRegistryPath();
    try {
        const data = await fs.readFile(registryPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Registry doesn't exist yet, return empty
        return { tapestries: [] };
    }
}

// Save registry to disk
async function saveRegistry(registry: TapestryRegistry): Promise<void> {
    const registryPath = getRegistryPath();
    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
}

// Scaffold a new Tapestry directory structure
async function scaffoldTapestry(tapestryPath: string, config: TapestryConfig): Promise<void> {
    // Create root directory
    await fs.mkdir(tapestryPath, { recursive: true });

    // Create .loom directory
    const loomDir = path.join(tapestryPath, '.loom');
    await fs.mkdir(loomDir, { recursive: true });

    // Write tapestry.json config
    const configPath = path.join(loomDir, 'tapestry.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

    // Create entries directory
    const entriesDir = path.join(tapestryPath, 'entries');
    await fs.mkdir(entriesDir, { recursive: true });

    // Create initial "Welcome" entry
    const welcomeId = uuidv4();
    const welcomeFrontmatter: EntryFrontmatter = {
        id: welcomeId,
        title: 'The First Thread',
        category: 'session',
        tags: ['intro'],
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
    const welcomePath = path.join(entriesDir, 'The First Thread.md');
    await fs.writeFile(welcomePath, welcomeMarkdown, 'utf-8');
}

// Parse frontmatter from markdown file
async function parseEntry(filePath: string): Promise<{ frontmatter: EntryFrontmatter; content: string }> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    return {
        frontmatter: data as EntryFrontmatter,
        content,
    };
}

// Build tree structure from filesystem
async function buildTree(dirPath: string, orderPath?: string): Promise<TapestryNode[]> {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    // Load order.json if it exists
    let order: string[] = [];
    if (orderPath) {
        try {
            const orderData = await fs.readFile(orderPath, 'utf-8');
            const orderJson: FolderOrder = JSON.parse(orderData);
            order = orderJson.entries || [];
        } catch {
            // No order file, use alphabetical
        }
    }

    const nodes: TapestryNode[] = [];

    // Process items in order
    const processedNames = new Set<string>();

    // First, add items from order
    for (const name of order) {
        const item = items.find(i => i.name === name);
        if (item) {
            const node = await buildNode(dirPath, item);
            if (node) {
                nodes.push(node);
                processedNames.add(name);
            }
        }
    }

    // Then add remaining items alphabetically
    const remaining = items
        .filter(item => !processedNames.has(item.name) && !item.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name));

    for (const item of remaining) {
        const node = await buildNode(dirPath, item);
        if (node) {
            nodes.push(node);
        }
    }

    return nodes;
}

// Build a single tree node
async function buildNode(parentPath: string, item: Dirent): Promise<TapestryNode | null> {
    const itemPath = path.join(parentPath, item.name);

    if (item.isDirectory()) {
        // Skip .loom directory
        if (item.name === '.loom') return null;

        const children = await buildTree(itemPath, path.join(itemPath, '.loom', 'order.json'));
        return {
            id: itemPath,
            type: 'folder',
            name: item.name,
            path: itemPath,
            children,
        };
    } else if (item.isFile() && item.name.endsWith('.md')) {
        try {
            const { frontmatter } = await parseEntry(itemPath);
            return {
                id: frontmatter.id,
                type: 'entry',
                name: frontmatter.title || item.name.replace('.md', ''),
                path: itemPath,
                category: frontmatter.category,
            };
        } catch (error) {
            console.error(`Error parsing entry ${itemPath}:`, error);
            return null;
        }
    }

    return null;
}

// Register IPC handlers
export function registerTapestryHandlers() {
    // Load registry
    ipcMain.handle('tapestry:loadRegistry', async (): Promise<TapestryRegistry> => {
        return await loadRegistry();
    });

    // Create new Tapestry
    ipcMain.handle('tapestry:create', async (_, data: CreateTapestryData): Promise<string> => {
        const registry = await loadRegistry();

        const id = uuidv4();
        const now = new Date().toISOString();

        // Determine tapestry path
        const basePath = data.basePath || path.join(app.getPath('documents'), 'Anvil and Loom', 'Tapestries');
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const tapestryPath = path.join(basePath, slug);

        // Create tapestry config
        const config: TapestryConfig = {
            id,
            name: data.name,
            description: data.description,
            imagePath: data.imagePath,
            defaultEntryCategory: 'session',
        };

        // Scaffold the tapestry
        await scaffoldTapestry(tapestryPath, config);

        // Add to registry
        const entry: TapestryRegistryEntry = {
            id,
            name: data.name,
            path: tapestryPath,
            description: data.description,
            imagePath: data.imagePath,
            createdAt: now,
            updatedAt: now,
        };

        registry.tapestries.push(entry);
        await saveRegistry(registry);

        return id;
    });

    // Open Tapestry (load config)
    ipcMain.handle('tapestry:open', async (_, id: string): Promise<TapestryConfig | null> => {
        const registry = await loadRegistry();
        const entry = registry.tapestries.find(t => t.id === id);

        if (!entry) return null;

        const configPath = path.join(entry.path, '.loom', 'tapestry.json');
        try {
            const configData = await fs.readFile(configPath, 'utf-8');
            const config: TapestryConfig = JSON.parse(configData);

            // Update lastOpenedAt
            entry.lastOpenedAt = new Date().toISOString();
            await saveRegistry(registry);

            return config;
        } catch (error) {
            console.error(`Error loading tapestry config:`, error);
            return null;
        }
    });

    // Update Tapestry metadata
    ipcMain.handle('tapestry:update', async (_, id: string, updates: UpdateTapestryData): Promise<void> => {
        const registry = await loadRegistry();
        const entry = registry.tapestries.find(t => t.id === id);

        if (!entry) throw new Error('Tapestry not found');

        // Update registry entry
        if (updates.name) entry.name = updates.name;
        if (updates.description !== undefined) entry.description = updates.description;
        if (updates.imagePath !== undefined) entry.imagePath = updates.imagePath;
        entry.updatedAt = new Date().toISOString();

        await saveRegistry(registry);

        // Update tapestry.json
        const configPath = path.join(entry.path, '.loom', 'tapestry.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        const config: TapestryConfig = JSON.parse(configData);

        if (updates.name) config.name = updates.name;
        if (updates.description !== undefined) config.description = updates.description;
        if (updates.imagePath !== undefined) config.imagePath = updates.imagePath;

        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    });

    // Remove Tapestry from registry (keep files)
    ipcMain.handle('tapestry:remove', async (_, id: string): Promise<void> => {
        const registry = await loadRegistry();
        registry.tapestries = registry.tapestries.filter(t => t.id !== id);
        await saveRegistry(registry);
    });

    // Delete Tapestry from disk
    ipcMain.handle('tapestry:delete', async (_, id: string): Promise<void> => {
        const registry = await loadRegistry();
        const entry = registry.tapestries.find(t => t.id === id);

        if (!entry) throw new Error('Tapestry not found');

        // Delete directory
        await fs.rm(entry.path, { recursive: true, force: true });

        // Remove from registry
        registry.tapestries = registry.tapestries.filter(t => t.id !== id);
        await saveRegistry(registry);
    });

    // Load tree structure
    ipcMain.handle('tapestry:loadTree', async (_, tapestryId: string): Promise<TapestryNode | null> => {
        const registry = await loadRegistry();
        const entry = registry.tapestries.find(t => t.id === tapestryId);

        if (!entry) return null;

        const entriesPath = path.join(entry.path, 'entries');
        const children = await buildTree(entriesPath, path.join(entriesPath, '.loom', 'order.json'));

        return {
            id: entry.id,
            type: 'folder',
            name: entry.name,
            path: entriesPath,
            children,
        };
    });

    // Load entry
    ipcMain.handle('tapestry:loadEntry', async (_, entryPath: string): Promise<EntryDoc | null> => {
        try {
            const { frontmatter, content } = await parseEntry(entryPath);
            return {
                id: frontmatter.id,
                path: entryPath,
                title: frontmatter.title,
                category: frontmatter.category,
                content,
                frontmatter,
                isDirty: false,
            };
        } catch (error) {
            console.error(`Error loading entry:`, error);
            return null;
        }
    });

    // Save entry
    ipcMain.handle('tapestry:saveEntry', async (_, entry: EntryDoc): Promise<void> => {
        const markdown = matter.stringify(entry.content, entry.frontmatter);
        await fs.writeFile(entry.path, markdown, 'utf-8');
    });

    // Create new entry
    ipcMain.handle('tapestry:createEntry', async (_, parentPath: string, title: string, category: string): Promise<string> => {
        const id = uuidv4();
        const frontmatter: EntryFrontmatter = {
            id,
            title,
            category: category as any,
            tags: [],
        };

        const content = `# ${title}\n\nYour content here...\n`;
        const markdown = matter.stringify(content, frontmatter);

        const fileName = `${title}.md`;
        const filePath = path.join(parentPath, fileName);
        await fs.writeFile(filePath, markdown, 'utf-8');

        return id;
    });

    // Create new folder
    ipcMain.handle('tapestry:createFolder', async (_, parentPath: string, name: string): Promise<void> => {
        const folderPath = path.join(parentPath, name);
        await fs.mkdir(folderPath, { recursive: true });
    });

    // Rename file/folder
    ipcMain.handle('tapestry:rename', async (_, oldPath: string, newName: string): Promise<void> => {
        const parentDir = path.dirname(oldPath);
        const ext = path.extname(oldPath);

        // If original had extension and new name doesn't, append it
        let finalName = newName;
        if (ext && !newName.endsWith(ext)) {
            finalName += ext;
        }

        const newPath = path.join(parentDir, finalName);
        await fs.rename(oldPath, newPath);

        // If it's a markdown file, update the title in frontmatter
        if (finalName.endsWith('.md')) {
            try {
                const fileContent = await fs.readFile(newPath, 'utf-8');
                const { data, content } = matter(fileContent);

                // Update title
                data.title = newName.replace('.md', '');

                const updatedMarkdown = matter.stringify(content, data);
                await fs.writeFile(newPath, updatedMarkdown, 'utf-8');
            } catch (error) {
                console.error('Failed to update frontmatter title after rename:', error);
            }
        }
    });

    // Delete file/folder
    ipcMain.handle('tapestry:deleteNode', async (_, nodePath: string): Promise<void> => {
        const stats = await fs.stat(nodePath);
        if (stats.isDirectory()) {
            await fs.rm(nodePath, { recursive: true, force: true });
        } else {
            await fs.unlink(nodePath);
        }
    });

    // Move file/folder
    ipcMain.handle('tapestry:move', async (_, sourcePath: string, destinationFolder: string, itemName: string): Promise<void> => {
        const destinationPath = path.join(destinationFolder, itemName);
        await fs.rename(sourcePath, destinationPath);
    });

    // Update order.json
    ipcMain.handle('tapestry:updateOrder', async (_, folderPath: string, order: string[]): Promise<void> => {
        const loomDir = path.join(folderPath, '.loom');
        await fs.mkdir(loomDir, { recursive: true });

        const orderPath = path.join(loomDir, 'order.json');
        const orderData: FolderOrder = { entries: order };
        await fs.writeFile(orderPath, JSON.stringify(orderData, null, 2), 'utf-8');
    });
}
