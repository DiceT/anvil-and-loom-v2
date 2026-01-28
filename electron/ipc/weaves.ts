/**
 * Weave IPC Handlers
 * 
 * Handles all Weave-related IPC operations for table management and rolling.
 * Tables are stored in the .weave folder within each Tapestry.
 */

import { app, ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import type {
    Table,
    WeaveTableListResponse,
    WeaveTableResponse,
    WeaveSaveTableResponse,
    WeaveDeleteTableResponse,
    WeaveRollResponse,
    WeaveSetTapestryPathResponse,
} from '../../src/types/weave';
import { RandomTableEngine } from '../../src/core/weave/RandomTableEngine';
import { TokenResolver } from '../../src/core/weave/TokenResolver';

// Store the current Tapestry path for Weave operations
let currentTapestryPath: string | null = null;

// Cache for tables to avoid repeated file reads
const tableCache = new Map<string, Table>();

// Namespace for deterministic IDs (Standard UUID for URL namespace)
const STANDARD_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Get the path to the standard tables directory
 * Handles both development (src/data/environments) and production (resources/data/environments)
 */
function getStandardTablesPath(): string {
    if (app.isPackaged) {
        // Production: resources/data/environments
        return path.join(process.resourcesPath, 'data', 'environments');
    } else {
        // Development: src/data/environments
        // Use process.cwd() which points to project root in dev mode (electron-vite)
        return path.join(process.cwd(), 'src', 'data', 'environments');
    }
}

/**
 * Get the directory path for a specific namespace (e.g., .weave or .environment)
 */
function getNamespaceDirPath(namespace: '.weave' | '.environment'): string {
    if (!currentTapestryPath) {
        throw new Error('No Tapestry path set. Call weave:setTapestryPath first.');
    }
    return path.join(currentTapestryPath, namespace);
}

/**
 * Ensure the directory exists
 */
async function ensureNamespaceDir(namespace: '.weave' | '.environment'): Promise<string> {
    const dir = getNamespaceDirPath(namespace);
    await fs.mkdir(dir, { recursive: true });
    return dir;
}

/**
 * Sanitize a string to be safe for filenames
 */
function sanitizeFilename(name: string): string {
    // Replace invalid characters with hyphens
    return name.replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim()
        .slice(0, 64); // Limit length
}

/**
 * Get a unique file path for a table, handling collisions
 */
async function getUniqueFilePath(dir: string, name: string, tableId: string): Promise<string> {
    const sanitized = sanitizeFilename(name) || 'Untitled-Table';
    let fileName = `${sanitized}.json`;
    let filePath = path.join(dir, fileName);

    // If file doesn't exist, it's ours
    try {
        await fs.access(filePath);
    } catch {
        return filePath;
    }

    // File exists, check if it's the same table
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const existing = JSON.parse(data) as Table;
        if (existing.id === tableId) {
            return filePath; // It's us!
        }
    } catch {
        // Ignore read error, treat as collision
    }

    // Collision: append number
    let counter = 1;
    while (true) {
        fileName = `${sanitized} (${counter}).json`;
        filePath = path.join(dir, fileName);
        try {
            await fs.access(filePath);
            // File exists, check if it's us (unlikely for incrementing counter, but safety first)
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                const existing = JSON.parse(data) as Table;
                if (existing.id === tableId) {
                    return filePath;
                }
            } catch { }
            counter++;
        } catch {
            return filePath; // Free slot
        }
    }
}

/**
 * Recursively read files from a directory
 */
async function getFilesRecursive(dir: string): Promise<string[]> {
    try {
        const dirents = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(dirents.map(async (dirent) => {
            const res = path.join(dir, dirent.name);
            return dirent.isDirectory() ? getFilesRecursive(res) : res;
        }));
        return files.flat();
    } catch (err) {
        // console.warn(`[getFilesRecursive] Failed to read ${dir}:`, err);
        return [];
    }
}

/**
 * Read all table files from a specific directory (recursive)
 */
async function readTableFiles(dirPath: string): Promise<Table[]> {
    try {
        const filePaths = await getFilesRecursive(dirPath);

        const tables: Table[] = [];

        for (const filePath of filePaths) {
            if (filePath.endsWith('.json')) {
                const fileName = path.basename(filePath);
                try {
                    const data = await fs.readFile(filePath, 'utf-8');
                    let parsed: any;
                    try {
                        parsed = JSON.parse(data);
                    } catch (e) {
                        console.error(`Failed to parse JSON for ${fileName}`, e);
                        continue;
                    }

                    // Handle disparate formats:
                    // 1. Array of Tables (e.g. blighted.json)
                    // 2. Object with "tables" array (e.g. profane.json)
                    // 3. Single Table object
                    let tableList: Table[] = [];

                    if (Array.isArray(parsed)) {
                        tableList = parsed;
                    } else if (parsed && typeof parsed === 'object') {
                        if (Array.isArray(parsed.tables)) {
                            tableList = parsed.tables;
                        } else {
                            // Assuming single table
                            tableList = [parsed];
                        }
                    }

                    for (const table of tableList) {
                        // FIX: Infer Category from File Path for Standard Tables
                        // Files are in .../aspect/blighted.json or .../domain/catacombs.json
                        // We want Category to be "Aspect - Blighted" or "Domain - Catacombs"

                        // use path.sep to handle cross-platform separators
                        const parentDir = path.dirname(filePath).split(path.sep).pop()?.toLowerCase();
                        const baseName = path.basename(filePath, '.json');
                        const groupName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

                        if (parentDir === 'aspect' || parentDir === 'aspects') {
                            table.category = `Aspect - ${groupName}`;
                        } else if (parentDir === 'domain' || parentDir === 'domains') {
                            table.category = `Domain - ${groupName}`;
                        }

                        // FIX: Ensure ID exists. Standard tables (Array) might not have IDs.
                        // Generate deterministic ID based on Name + Category to allow persistence/overriding.
                        if (!table.id) {
                            const uniqueString = `${table.category || ''}:${table.name}`;
                            table.id = uuidv5(uniqueString, STANDARD_NAMESPACE);
                        }

                        // Ensure sourcePath is set to the file we read it from
                        // (Note unless overriding, standard tables in arrays map to the same file)
                        table.sourcePath = filePath;

                        tableCache.set(table.id, table);
                        tables.push(table);
                    }
                } catch (error) {
                    console.error(`Failed to read table file ${fileName}:`, error);
                }
            }
        }

        return tables;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn(`[readTableFiles] Directory not found: ${dirPath}`);
            return [];
        }
        throw error;
    }
}

/**
 * Write a table to its file
 */
async function writeTableFile(table: Table, namespace: '.weave' | '.environment'): Promise<void> {
    const rootDir = await ensureNamespaceDir(namespace);

    let targetDir = rootDir;

    // Handle subdirectories for Environment
    if (namespace === '.environment' && table.category) {
        if (table.category.startsWith('Aspect - ')) {
            const aspectName = table.category.replace('Aspect - ', '').trim();
            targetDir = path.join(rootDir, 'Aspects', sanitizeFilename(aspectName));
        } else if (table.category.startsWith('Domain - ')) {
            const domainName = table.category.replace('Domain - ', '').trim();
            targetDir = path.join(rootDir, 'Domains', sanitizeFilename(domainName));
        }
    }

    await fs.mkdir(targetDir, { recursive: true });

    // Calculate new path based on Name
    const newPath = await getUniqueFilePath(targetDir, table.name, table.id);

    // CRITICAL FIX: Use the CACHED sourcePath to identify the file to delete.
    // The frontend's table.sourcePath might be stale during rapid edits/renames.
    // The cache knows where we last wrote this specific ID.
    const cachedTable = tableCache.get(table.id);
    const oldPath = cachedTable?.sourcePath || table.sourcePath;

    // If we have an old path and it's different, remove the old file (Rename/Move)
    if (oldPath && oldPath !== newPath) {
        try {
            // Only try to delete if it's in a user writable location
            // Standard tables will have paths like '.../src/data/...' or '.../resources/...'
            // User tables have '.../.environment/...' or '.../.weave/...'
            // We can check if it starts with the current tapestry path
            if (currentTapestryPath && oldPath.startsWith(currentTapestryPath)) {
                await fs.access(oldPath);
                await fs.unlink(oldPath);
            }
        } catch (e) {
            // Ignore (file might already be gone or read-only)
        }
    }

    table.sourcePath = newPath;
    await fs.writeFile(newPath, JSON.stringify(table, null, 2), 'utf-8');

    // Update cache
    tableCache.set(table.id, table);
}

/**
 * Delete a table file
 */
async function deleteTableFile(tableId: string): Promise<void> {
    const table = tableCache.get(tableId);
    if (table && table.sourcePath) {
        try {
            // Only allow deleting user tables
            if (currentTapestryPath && table.sourcePath.startsWith(currentTapestryPath)) {
                await fs.unlink(table.sourcePath);
            } else {
                throw new Error('Cannot delete standard tables');
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    tableCache.delete(tableId);
}

/**
 * Find a table by ID
 */
function findTableById(tableId: string): Table | null {
    return tableCache.get(tableId) ?? null;
}

/**
 * Find a table by tag
 */
function findTableByTag(tag: string): Table | null {
    for (const table of tableCache.values()) {
        if (table.tags && Array.isArray(table.tags) && table.tags.includes(tag)) {
            return table;
        }
    }
    return null;
}

/**
 * Roll on a table with optional token resolution
 */
function rollTable(table: Table, resolveTokens: boolean = true): any {
    const engine = new RandomTableEngine();
    const result = engine.roll(table);

    if (resolveTokens) {
        // Handle TableReference explicitly (recursive roll)
        if (typeof result.result === 'object' && result.result !== null && 'tag' in result.result) {
            const refTag = (result.result as any).tag;
            const refTable = findTableByTag(refTag);
            if (refTable) {
                const subResult = rollTable(refTable, true);
                // Merge context from sub-roll
                return {
                    seed: result.seed,
                    tableChain: [table.name, ...subResult.tableChain],
                    rolls: [...result.rolls, ...subResult.rolls],
                    warnings: [...result.warnings, ...subResult.warnings],
                    result: subResult.result,
                };
            }
            // If table not found, fall through or return as is?
            // Fall through might confuse TokenResolver if it still doesn't like TableReference.
            // But if we can't resolve it, we assume it's just a result value?
            // We should probably just return it if we can't find the table.
            return result;
        }

        const resolver = new TokenResolver();
        const resolved = resolver.resolve(result.result as string | Record<string, unknown>, (tag) => {
            const refTable = findTableByTag(tag);
            if (refTable) {
                // Pass the initial roll value when resolving tokens recursively
                return rollTable(refTable, true);
            }
            return null;
        });

        // Combine initial roll with any additional rolls from token resolution
        const allRolls = [...result.rolls, ...resolved.context.rolls];

        return {
            seed: result.seed,
            tableChain: [table.name, ...resolved.context.tableChain],
            rolls: allRolls,
            warnings: [...result.warnings, ...resolved.context.warnings],
            result: resolved.resolved,
        };
    }

    return result;
}

/**
 * Register all Weave IPC handlers
 */
export function registerWeaveHandlers() {
    // Set the current Tapestry path for Weave operations
    ipcMain.handle('weave:setTapestryPath', async (_event, tapestryPath: string): Promise<WeaveSetTapestryPathResponse> => {
        try {
            // Verify the path exists
            await fs.access(tapestryPath);

            // Clear cache when switching tapestries
            tableCache.clear();
            currentTapestryPath = tapestryPath;

            // Ensure directories exist
            await ensureNamespaceDir('.weave');
            await ensureNamespaceDir('.environment');

            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message ?? 'Failed to set Tapestry path',
            };
        }
    });

    // --- WEAVE HANDLERS ---

    // Get all tables from the current Tapestry's .weave folder
    ipcMain.handle('weave:getTables', async (): Promise<WeaveTableListResponse> => {
        try {
            if (!currentTapestryPath) {
                return {
                    tables: [],
                    error: 'No Tapestry path set. Call weave:setTapestryPath first.',
                };
            }

            const tables = await readTableFiles(getNamespaceDirPath('.weave'));
            return { tables };
        } catch (error: any) {
            return {
                tables: [],
                error: error?.message ?? 'Failed to load tables',
            };
        }
    });

    // Get a specific table by ID
    ipcMain.handle('weave:getTable', async (_event, tableId: string): Promise<WeaveTableResponse> => {
        try {
            // Try cache first
            let table = findTableById(tableId);

            // If not in cache, try loading from disk
            if (!table) {
                // Check .weave
                const weaveDir = getNamespaceDirPath('.weave');
                let filePath = path.join(weaveDir, `${tableId}.json`);

                try {
                    const data = await fs.readFile(filePath, 'utf-8');
                    table = JSON.parse(data) as Table;
                    table.sourcePath = filePath;
                    tableCache.set(tableId, table);
                } catch {
                    // Check .environment
                    const envDir = getNamespaceDirPath('.environment');
                    filePath = path.join(envDir, `${tableId}.json`);
                    try {
                        const data = await fs.readFile(filePath, 'utf-8');
                        table = JSON.parse(data) as Table;
                        table.sourcePath = filePath;
                        tableCache.set(tableId, table);
                    } catch {
                        // Check Standard tables
                        // We might not know the exact path without scanning, but we shouldn't rely on getTable(id)
                        // for discovery usually. However, if cache was cleared, we might need it.
                        // Ideally we should reload all tables if we're desperate, or scan recursively.
                        // For now, fail if not in cache or direct known paths.
                        // Actually, let's try reading all standard tables into cache if we miss?
                        // That's heavy.
                        // Let's assume the frontend calls getTables first.
                        return {
                            table: null,
                            error: `Table with ID ${tableId} not found`,
                        };
                    }
                }
            }

            return { table };
        } catch (error: any) {
            return {
                table: null,
                error: error?.message ?? 'Failed to load table',
            };
        }
    });

    // Save a table (create or update)
    ipcMain.handle('weave:saveTable', async (_event, table: Table): Promise<WeaveSaveTableResponse> => {
        try {
            if (!currentTapestryPath) {
                return {
                    success: false,
                    error: 'No Tapestry path set. Call weave:setTapestryPath first.',
                };
            }

            // Ensure table has an ID
            if (!table.id) {
                table.id = uuidv4();
            }

            // Ensure table has schema version
            if (!table.schemaVersion) {
                table.schemaVersion = 1;
            }

            // INTELLIGENT SAVE: Check where the table belongs
            // If it has a sourcePath pointing to .environment, OR if we find it in the environment directory, save there.
            let namespace: '.weave' | '.environment' = '.weave'; // Default

            // 1. Check strict Categories (Aspects/Domains are ALWAYS environment)
            if (table.category) {
                if (table.category.startsWith('Aspect - ') ||
                    table.category.startsWith('Domain - ') ||
                    table.category === 'Environment') {
                    namespace = '.environment';
                }
            }

            // 2. Check sourcePath (Trust existing location if it's explicitly environment)
            // Check both incoming path AND cached path immediately
            const pathToCheck = table.sourcePath || findTableById(table.id)?.sourcePath;
            if (pathToCheck && (pathToCheck.includes('.environment') || pathToCheck.includes(path.sep + '.environment'))) {
                namespace = '.environment';
            }

            // 3. Last check: If no path/category match, check if ID exists in Environment
            // (Already covered by using cached path above, but keeping for safety checks on ID lookups if paths fail)
            if (namespace === '.weave') {
                const cached = findTableById(table.id);
                if (cached && (
                    cached.category === 'Environment' ||
                    cached.category?.startsWith('Aspect - ') ||
                    cached.category?.startsWith('Domain - ')
                )) {
                    namespace = '.environment';
                }
            }

            // If modifying a Standard table, we MUST save it to the User's .environment folder
            // This happens automatically since writeTableFile writes to `getNamespaceDirPath(namespace)`
            // which is the User's workspace.
            await writeTableFile(table, namespace);

            return { success: true, table };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message ?? 'Failed to save table',
            };
        }
    });

    // Delete a table
    ipcMain.handle('weave:deleteTable', async (_event, tableId: string): Promise<WeaveDeleteTableResponse> => {
        try {
            if (!currentTapestryPath) {
                return {
                    success: false,
                    error: 'No Tapestry path set. Call weave:setTapestryPath first.',
                };
            }

            await deleteTableFile(tableId);

            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message ?? 'Failed to delete table',
            };
        }
    });

    // Roll on a table and return result
    ipcMain.handle('weave:rollTable', async (_event, tableId: string, seed?: string): Promise<WeaveRollResponse> => {
        try {
            if (!currentTapestryPath) {
                return {
                    result: null,
                    error: 'No Tapestry path set. Call weave:setTapestryPath first.',
                };
            }

            let table = findTableById(tableId);

            // If checking a standard table that hasn't been loaded yet
            if (!table) {
                // Try to reload tables to find it? Or simple fail?
                // Since getTables is usually called at startup, it should be in cache.
                return {
                    result: null,
                    error: `Table with ID ${tableId} not found`,
                };
            }

            const options: any = {};
            if (seed) {
                options.seed = seed;
            }

            const result = rollTable(table, true);

            return { result };
        } catch (error: any) {
            return {
                result: null,
                error: error?.message ?? 'Failed to roll table',
            };
        }
    });
    // --- ENVIRONMENT HANDLERS ---

    ipcMain.handle('environment:getTables', async (): Promise<WeaveTableListResponse> => {
        try {
            if (!currentTapestryPath) {
                return {
                    tables: [],
                    error: 'No Tapestry path set.',
                };
            }

            // 1. Read User Tables (.environment)
            const userTables = await readTableFiles(getNamespaceDirPath('.environment'));

            // 2. Read Standard Tables
            const standardTablesPath = getStandardTablesPath();
            const standardTables = await readTableFiles(standardTablesPath);

            // 3. Merge: User tables act as overrides for Standard tables with same ID
            const tableMap = new Map<string, Table>();

            // Load standard first
            for (const t of standardTables) {
                tableMap.set(t.id, t);
            }

            // Overwrite with user tables
            for (const t of userTables) {
                tableMap.set(t.id, t);
            }

            // Update cache with FINAL list
            for (const t of tableMap.values()) {
                tableCache.set(t.id, t);
            }

            return { tables: Array.from(tableMap.values()) };
        } catch (error: any) {
            return {
                tables: [],
                error: error?.message ?? 'Failed to load environment tables',
            };
        }
    });

    ipcMain.handle('environment:saveTable', async (_event, table: Table): Promise<WeaveSaveTableResponse> => {
        try {
            if (!currentTapestryPath) return { success: false, error: 'No Tapestry path set.' };
            if (!table.id) table.id = uuidv4();
            if (!table.schemaVersion) table.schemaVersion = 1;

            await writeTableFile(table, '.environment');
            return { success: true, table };
        } catch (error: any) {
            return { success: false, error: error?.message ?? 'Failed to save environment table' };
        }
    });

    ipcMain.handle('environment:deleteTable', async (_event, tableId: string): Promise<WeaveDeleteTableResponse> => {
        try {
            if (!currentTapestryPath) return { success: false, error: 'No Tapestry path set.' };
            await deleteTableFile(tableId);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error?.message ?? 'Failed to delete table' };
        }
    });
}
