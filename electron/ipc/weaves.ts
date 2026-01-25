/**
 * Weave IPC Handlers
 * 
 * Handles all Weave-related IPC operations for table management and rolling.
 * Tables are stored in the .weave folder within each Tapestry.
 */

import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
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

/**
 * Get the .weave directory path for the current Tapestry
 */
function getWeaveDirPath(): string {
    if (!currentTapestryPath) {
        throw new Error('No Tapestry path set. Call weave:setTapestryPath first.');
    }
    return path.join(currentTapestryPath, '.weave');
}

/**
 * Ensure the .weave directory exists
 */
async function ensureWeaveDir(): Promise<string> {
    const weaveDir = getWeaveDirPath();
    await fs.mkdir(weaveDir, { recursive: true });
    return weaveDir;
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
 * Read all table files from the .weave directory
 */
async function readTableFiles(): Promise<Table[]> {
    try {
        const weaveDir = getWeaveDirPath();
        const entries = await fs.readdir(weaveDir, { withFileTypes: true });
        const tables: Table[] = [];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/i;

        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.json')) {
                const oldPath = path.join(weaveDir, entry.name);
                try {
                    const data = await fs.readFile(oldPath, 'utf-8');
                    const table = JSON.parse(data) as Table;

                    let currentPath = oldPath;

                    // MIGRATION: If filename is UUID, rename it to Human Readable
                    if (uuidRegex.test(entry.name)) {
                        const newPath = await getUniqueFilePath(weaveDir, table.name, table.id);
                        if (newPath !== oldPath) {
                            try {
                                await fs.rename(oldPath, newPath);
                                currentPath = newPath;
                            } catch (err) {
                                console.error(`Failed to migrate table ${entry.name}`, err);
                            }
                        }
                    }

                    // Update sourcePath
                    table.sourcePath = currentPath;

                    // Cache the table
                    tableCache.set(table.id, table);
                    tables.push(table);
                } catch (error) {
                    console.error(`Failed to read table file ${entry.name}:`, error);
                }
            }
        }

        return tables;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // .weave directory doesn't exist yet
            return [];
        }
        throw error;
    }
}

/**
 * Write a table to its file
 */
async function writeTableFile(table: Table): Promise<void> {
    const weaveDir = await ensureWeaveDir();

    // Calculate new path based on Name
    const newPath = await getUniqueFilePath(weaveDir, table.name, table.id);

    // If sourcePath exists and is different, remove the old file (Rename)
    if (table.sourcePath && table.sourcePath !== newPath) {
        try {
            // Only delete if the old path actually exists
            await fs.access(table.sourcePath);
            await fs.unlink(table.sourcePath);
        } catch (e) {
            // Ignore (maybe file didn't exist or we can't delete it)
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
            await fs.unlink(table.sourcePath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    } else {
        // Fallback or retry? cache should be populated.
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
        if (table.tags.includes(tag)) {
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

            // Ensure .weave directory exists
            await ensureWeaveDir();

            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message ?? 'Failed to set Tapestry path',
            };
        }
    });

    // Get all tables from the current Tapestry's .weave folder
    ipcMain.handle('weave:getTables', async (): Promise<WeaveTableListResponse> => {
        try {
            if (!currentTapestryPath) {
                return {
                    tables: [],
                    error: 'No Tapestry path set. Call weave:setTapestryPath first.',
                };
            }

            const tables = await readTableFiles();
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
                const weaveDir = getWeaveDirPath();
                const filePath = path.join(weaveDir, `${tableId}.json`);

                try {
                    const data = await fs.readFile(filePath, 'utf-8');
                    table = JSON.parse(data) as Table;
                    table.sourcePath = filePath;
                    tableCache.set(tableId, table);
                } catch (error: any) {
                    if (error.code === 'ENOENT') {
                        return {
                            table: null,
                            error: `Table with ID ${tableId} not found`,
                        };
                    }
                    throw error;
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

            // Save to disk
            await writeTableFile(table);

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

            const table = findTableById(tableId);
            if (!table) {
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
}
