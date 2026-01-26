
import { ThreadAction, ActionContext } from './types';
import { Thread } from '../../../types/thread';
import { ThreadAnalysis } from '../threadAnalyzer';
import { Link, Play, Dices } from 'lucide-react';
import { useEnvironmentStore } from '../../../stores/useEnvironmentStore';
import { useToolStore } from '../../../stores/useToolStore';
import { useMacroStore } from '../../../stores/useMacroStore';
import { executeMacro } from '../../macro/executeMacro';

// Action to Open Aspect/Domain logic here to avoid circular dep, or import just types?
// Using lazy import or hooks logic inside the execute function.

export const openAspectOrDomainAction: ThreadAction = {
    id: 'open-aspect-domain',
    label: 'Open',
    description: 'Open this Aspect or Domain in the Environment panel',
    icon: Link,
    isEnabled: () => true, // Always valid if available
    isAvailable: (thread: Thread, _analysis: ThreadAnalysis, _context: ActionContext) => {
        const meta = thread.meta?.weave as any;
        const type = meta?.resultType as string | undefined;
        return (type === 'aspect' || type === 'domain') && !!meta?.targetId;
    },
    execute: async (thread: Thread, _context: ActionContext) => {
        const meta = thread.meta?.weave as any;
        if (!meta) return [];

        const targetId = meta.targetId; // This is likely the Name
        const type = meta.resultType; // 'aspect' or 'domain'

        // Logic similar to WikiLink
        const envStore = useEnvironmentStore.getState();
        const toolStore = useToolStore.getState();

        const folderName = `${type}-${targetId}`;

        // Switch to Environment
        toolStore.setRightPaneMode('environment');

        // Check/Expand folder
        // We might not know the exact folder ID format if it varies, but usually it's derived from Name.
        // Assuming targetId IS the name here because Aspect/Domain results are usually names.

        envStore.expandFolder(folderName);

        return [];
    }
};

export const runMacroAction: ThreadAction = {
    id: 'run-macro',
    label: 'Run Macro',
    description: 'Execute the macro associated with this result',
    icon: Play,
    isEnabled: () => true,
    isAvailable: (thread: Thread, _analysis: ThreadAnalysis, _context: ActionContext) => {
        const meta = thread.meta?.weave as any;
        const type = meta?.resultType as string | undefined;
        return type === 'macro' && !!meta?.targetId;
    },
    execute: async (thread: Thread, _context: ActionContext) => {
        const meta = thread.meta?.weave as any;
        if (!meta || !meta.targetId) return [];

        const macroId = meta.targetId;
        console.log('[WeaveActions] Attempting to run macro:', macroId);

        const macroStore = useMacroStore.getState();

        // Robust Lookup: global ID first, then Label/Name fallback
        let slot = macroStore.slots.find(s => s.id === macroId);

        if (!slot) {
            console.log('[WeaveActions] ID lookup failed, trying Name/Prop fallback for:', macroId);
            slot = macroStore.slots.find(s =>
                s.label === macroId ||
                s.oracleName === macroId ||
                s.tableName === macroId ||
                s.diceExpression === macroId ||
                s.clockName === macroId ||
                s.trackName === macroId ||
                s.panelTitle === macroId
            );
        }

        if (slot) {
            console.log('[WeaveActions] Found slot, executing:', slot);
            await executeMacro(slot);
        } else {
            console.warn('[WeaveActions] Macro not found for action:', macroId, 'Available slots:', macroStore.slots.map(s => s.id));
        }

        return [];
    }
};

export const rollTableAction: ThreadAction = {
    id: 'roll-table-result',
    label: 'Roll on Table',
    description: 'Roll on the resulting table',
    icon: Dices,
    isEnabled: () => true,
    isAvailable: (thread: Thread, _analysis: ThreadAnalysis, _context: ActionContext) => {
        const meta = thread.meta?.weave as any;
        const type = meta?.resultType as string | undefined;
        return type === 'table' && !!meta?.targetId;
    },
    execute: async (thread: Thread, _context: ActionContext) => {
        const meta = thread.meta?.weave as any;
        if (!meta || !meta.targetId) return [];

        const tableId = meta.targetId; // This should be the Table ID or Name

        // Dynamically import service to handle execution
        const { WeaveService } = await import('../../../core/weave/WeaveService');
        const { useWeaveStore } = await import('../../../stores/useWeaveStore');

        // Try to handle Name vs ID if needed, similar to Macros, 
        // but typically targetId here will be set to ID by the Logger if table found.
        // If it's a name (because logger couldn't find ID), we might need to search store.

        try {
            // Check if it's a valid ID in store
            const store = useWeaveStore.getState();
            let table = store.tables.find(t => t.id === tableId);
            if (!table) {
                table = store.tables.find(t => t.name === tableId);
            }

            if (table) {
                await WeaveService.roll(table.id);
            } else {
                console.warn('[WeaveActions] Table not found for roll:', tableId);
                // Try rolling by ID anyway, maybe it loads?
                await WeaveService.roll(tableId);
            }
        } catch (err) {
            console.error('[WeaveActions] Failed to roll table result', err);
        }

        return [];
    }
};
