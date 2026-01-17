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
 * Read all table files from the .weave directory
 */
async function readTableFiles(): Promise<Table[]> {
    try {
        const weaveDir = getWeaveDirPath();
        const entries = await fs.readdir(weaveDir, { withFileTypes: true });
        const tables: Table[] = [];

        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.json')) {
                const filePath = path.join(weaveDir, entry.name);
                try {
                    const data = await fs.readFile(filePath, 'utf-8');
                    const table = JSON.parse(data) as Table;

                    // Update sourcePath to current location
                    table.sourcePath = filePath;

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
    const fileName = `${table.id}.json`;
    const filePath = path.join(weaveDir, fileName);

    table.sourcePath = filePath;
    await fs.writeFile(filePath, JSON.stringify(table, null, 2), 'utf-8');

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
        const resolver = new TokenResolver();
        const resolved = resolver.resolve(result.result, (tag) => {
            const refTable = findTableByTag(tag);
            if (refTable) {
                // Pass the initial roll value when resolving tokens recursively
                return rollTable(refTable, true, result.rolls);
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
