/**
 * WeaveService - Service layer for Weave table operations
 *
 * Wraps IPC calls for table operations and provides a service layer
 * similar to Weave's original service but using Electron IPC.
 */

import type {
    Table,
    RollResult,
    WeaveTableListResponse,
    WeaveTableResponse,
    WeaveSaveTableResponse,
    WeaveDeleteTableResponse,
    WeaveRollResponse,
    WeaveSetTapestryPathResponse,
} from '../../types/weave';
import { logWeaveRoll } from './weaveRollLogger';

/**
 * WeaveService class for managing Weave table operations
 */
export class WeaveService {
    /**
     * Set the current Tapestry path for Weave operations
     */
    static async setTapestryPath(path: string): Promise<WeaveSetTapestryPathResponse> {
        return await window.electron.weave.setTapestryPath(path);
    }

    /**
     * Get all tables from the current Tapestry's .weave folder
     */
    static async getTables(): Promise<WeaveTableListResponse> {
        return await window.electron.weave.getTables();
    }

    /**
     * Get a specific table by ID
     */
    static async getTable(tableId: string): Promise<WeaveTableResponse> {
        return await window.electron.weave.getTable(tableId);
    }

    /**
     * Save a table (create or update)
     */
    static async saveTable(table: Table): Promise<WeaveSaveTableResponse> {
        const response = await window.electron.weave.saveTable(table);
        if (response.success && response.table) {
            window.dispatchEvent(new CustomEvent('weave:table-saved', { detail: response.table }));
        }
        return response;
    }

    /**
     * Delete a table
     */
    static async deleteTable(tableId: string): Promise<WeaveDeleteTableResponse> {
        return await window.electron.weave.deleteTable(tableId);
    }

    /**
     * Roll on a table and return result
     */
    static async rollTable(tableId: string, seed?: string, silent: boolean = false): Promise<WeaveRollResponse> {
        const response = await window.electron.weave.rollTable(tableId, seed);

        // Log to Thread Card engine if successful and not silent
        if (!silent && !response.error && response.result) {
            try {
                // Get the table to retrieve its name and metadata
                const tableResponse = await this.getTable(tableId);
                if (!tableResponse.error && tableResponse.table) {
                    logWeaveRoll(tableResponse.table.name, tableResponse.table, response.result);
                }
            } catch (error) {
                console.error('Failed to log Weave roll:', error);
                // Don't throw - logging failures shouldn't break the roll
            }
        }

        return response;
    }

    /**
     * Helper method to load tables and return them directly
     */
    static async loadTables(): Promise<Table[]> {
        const response = await this.getTables();
        if (response.error) {
            throw new Error(response.error);
        }
        return response.tables;
    }

    /**
     * Helper method to load a single table
     */
    static async loadTable(tableId: string): Promise<Table> {
        const response = await this.getTable(tableId);
        if (response.error || !response.table) {
            throw new Error(response.error || `Table ${tableId} not found`);
        }
        return response.table;
    }

    /**
     * Helper method to roll and get the result directly
     */
    static async roll(tableId: string, seed?: string, silent: boolean = false): Promise<RollResult> {
        const response = await this.rollTable(tableId, seed, silent);
        if (response.error || !response.result) {
            throw new Error(response.error || `Failed to roll on table ${tableId}`);
        }
        return response.result;
    }
}

/**
 * Singleton instance for convenience
 */
export const weaveService = WeaveService;
