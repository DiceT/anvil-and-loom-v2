/**
 * Environment Service
 * 
 * Handles IPC communication for Environment tool.
 * Mirrored from WeaveService but targeting environment:* handlers.
 */

import { Table, RollResult, WeaveTableListResponse, WeaveSaveTableResponse, WeaveDeleteTableResponse } from '../../types/weave';

// Reusing Weave types since the structure is identical

export const EnvironmentService = {
    async loadTables(): Promise<Table[]> {
        const response = await window.electron.environment.getTables() as WeaveTableListResponse;
        if (response.error) {
            throw new Error(response.error);
        }
        return response.tables;
    },

    async saveTable(table: Table): Promise<WeaveSaveTableResponse> {
        return await window.electron.environment.saveTable(table) as WeaveSaveTableResponse;
    },

    async deleteTable(tableId: string): Promise<WeaveDeleteTableResponse> {
        return await window.electron.environment.deleteTable(tableId) as WeaveDeleteTableResponse;
    },

    async getTable(tableId: string): Promise<{ table: Table | null; error?: string }> {
        // Re-use weave:getTable because the backend now searches both folders given an ID
        return await window.electron.weave.getTable(tableId) as { table: Table | null; error?: string };
    },

    // Rolling uses the same engine, so weave:rollTable works for any table if found in cache
    async roll(tableId: string, seed?: string, silent: boolean = false): Promise<RollResult> {
        const response = await window.electron.weave.rollTable(tableId, seed) as { result: RollResult | null; error?: string };
        if (response.error || !response.result) {
            throw new Error(response.error || 'Roll failed');
        }
        return response.result;
    }
};
