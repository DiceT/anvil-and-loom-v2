// ─────────────────────────────────────────────────────────────────────────────
// Session Actions Hook
// 
// Provides easy access to the action dispatcher and handlers in components.
// Injects dependencies (engines) into the action registry.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useCallback } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { useToolStore } from '../stores/useToolStore';
import { createActionRegistry } from '../services/actionDispatcher';
import { useSessionModalStore } from '../stores/useSessionModalStore';
import { diceEngine } from '../integrations/anvil-dice-app/engine/DiceEngine';
import { weaveAIService } from '../core/weave/WeaveAIService';
import { WeaveService } from '../core/weave/WeaveService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UseSessionActionsResult {
    dispatch: (action: string, params: Record<string, unknown>) => Promise<void>;
    openDiceModal: () => void;
    openOracleModal: () => void;
    openClockModal: () => void;
    openTrackModal: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook Implementation
// ─────────────────────────────────────────────────────────────────────────────

export const useSessionActions = (): UseSessionActionsResult => {
    const { setRightPaneMode, setActiveTool } = useToolStore();

    // ─────────────────────────────────────────────────────────────────────────
    // Registry Memoization
    // ─────────────────────────────────────────────────────────────────────────

    const registry = useMemo(() => {
        return createActionRegistry({
            diceEngine,
            weaveEngine: {
                // Adapter for WeaveService
                roll: async (tableIdOrName: string) => {
                    // If it looks like a UUID, roll by ID
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableIdOrName);

                    if (isUuid) {
                        const { useWeaveStore } = await import('../stores/useWeaveStore');
                        // Use consistent store roll to trigger 3D dice if available
                        const result = await useWeaveStore.getState().rollTable(tableIdOrName, undefined, false);
                        // We need to fetch table details to return expected format if WeaveService doesn't provide everything
                        // But WeaveService.roll returns RollResult which has what we need?
                        // Actually actionDispatcher expects { tableId, tableName, tableChain, rollValue, result }
                        // RollResult has { result, total, ... } ? Weave types are in ../types/weave

                        // Let's look at what WeaveService.roll returns. It returns RollResult. 
                        // We might need to fetch the table to get the name if we only have ID.

                        let tableName = 'Oracle Table';
                        try {
                            const table = await WeaveService.loadTable(tableIdOrName);
                            tableName = table.name;
                        } catch (e) {
                            console.warn('Failed to load table name', e);
                        }

                        return {
                            tableId: tableIdOrName,
                            tableName,
                            tableChain: [tableName], // Simplified
                            rollValue: 0, // We might not get the raw dice roll easily
                            result: result.result,
                        };
                    } else {
                        // Roll by name - not directly supported by WeaveService usually?
                        // For now, we'll fall back to AI interpretation or look up table by name
                        // Assuming we only get IDs for now or this is a placebo
                        console.warn('Rolling by name not fully supported yet', tableIdOrName);
                        return {
                            tableId: 'unknown',
                            tableName: tableIdOrName,
                            tableChain: [],
                            rollValue: 0,
                            result: 'Result via Name (Not Implemented)',
                        };
                    }
                }
            },
            aiEngine: weaveAIService,
            sessionStore: useSessionStore,
        });
    }, []); // Dependencies are singletons, so empty array is fine

    // ─────────────────────────────────────────────────────────────────────────
    // Dispatcher
    // ─────────────────────────────────────────────────────────────────────────

    const dispatch = useCallback(async (action: string, params: Record<string, unknown>) => {
        const handler = registry[action];

        if (!handler) {
            console.warn(`[useSessionActions] No handler for action: ${action}`);
            return;
        }

        try {
            await handler(params);
        } catch (error) {
            console.error(`[useSessionActions] Error executing action ${action}:`, error);
        }
    }, [registry]);

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    const openDiceModal = useCallback(() => {
        setRightPaneMode('dice');
        setActiveTool('dice');
    }, [setRightPaneMode, setActiveTool]);

    const openOracleModal = useCallback(() => {
        setRightPaneMode('weave');
        setActiveTool(null);
    }, [setRightPaneMode, setActiveTool]);

    const openClockModal = useCallback(() => {
        useSessionModalStore.getState().openClockModal();
    }, []);

    const openTrackModal = useCallback(() => {
        useSessionModalStore.getState().openTrackModal();
    }, []);

    return {
        dispatch,
        openDiceModal,
        openOracleModal,
        openClockModal,
        openTrackModal,
    };
};
