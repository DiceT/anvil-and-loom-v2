import { MacroSlot } from '../../types/macro'
import { useEditorStore } from '../../stores/useEditorStore'


/**
 * Execute a macro slot action
 */
export async function executeMacro(slot: MacroSlot): Promise<void> {
    switch (slot.type) {
        case 'dice':
            await executeDiceMacro(slot)
            break
        case 'table':
            await executeTableMacro(slot)
            break
        case 'panel':
            await executePanelMacro(slot)
            break
        case 'oracle':
            await executeOracleMacro(slot)
            break
        case 'clock':
            await executeClockMacro(slot)
            break
        case 'track':
            await executeTrackMacro(slot)
            break
    }
}

async function executeDiceMacro(slot: MacroSlot): Promise<void> {
    if (!slot.diceExpression) return

    // Import dice engine and roll
    const { rollDiceExpression } = await import('../../core/dice/diceEngine')
    const result = await rollDiceExpression(slot.diceExpression)

    // Import store to add card
    const { useSessionStore } = await import('../../stores/useSessionStore')
    const { createDiceCard } = await import('../../utils/threadCardFactory')

    const { activeSessionId, addCard } = useSessionStore.getState()

    if (activeSessionId) {
        const card = createDiceCard(activeSessionId, {
            expression: slot.diceExpression,
            rolls: result.rolls.map((r: any) => r.value),
            total: result.total,
            modifier: 0, // Simplified for now
            // success: result.success // If available
        })
        addCard(card)
    }
}

async function executeTableMacro(slot: MacroSlot): Promise<void> {
    if (!slot.tableId) return

    const { useWeaveStore } = await import('../../stores/useWeaveStore')
    const { logWeaveRoll } = await import('../../core/weave/weaveRollLogger')

    const store = useWeaveStore.getState();
    let table = store.tables.find(t => t.id === slot.tableId);

    if (!table) {
        // Try loading if not in store
        const { WeaveService } = await import('../../core/weave/WeaveService');
        try {
            table = await WeaveService.loadTable(slot.tableId!);
        } catch (err) {
            console.warn(`[Macro] Failed to load table: ${slot.tableId}`, err);
            return;
        }
    }

    if (!table) {
        console.warn(`[Macro] Table load returned null: ${slot.tableId}`);
        return;
    }

    // Pass silent=true to prevent internal duplication if any, but mainly we want the Result object
    const result = await store.rollTable(table.id, undefined, true)

    if (!result) return

    // Use the central Weave Logger to ensure consistent formatting, Metadata, and Action Buttons
    await logWeaveRoll(table.name, table, result);
}

async function executePanelMacro(slot: MacroSlot): Promise<void> {
    if (!slot.panelPath) return

    const { openEntry } = useEditorStore.getState()
    await openEntry(slot.panelPath)
}

async function executeOracleMacro(slot: MacroSlot): Promise<void> {
    console.log('[executeMacro] Executing Oracle Macro:', slot);
    if (!slot.oracleTableIds || slot.oracleTableIds.length !== 2) {
        console.warn('[executeMacro] Invalid oracle slot configuration:', slot);
        return
    }

    const { useWeaveStore } = await import('../../stores/useWeaveStore')
    const store = useWeaveStore.getState()

    // Pass silent=true to prevent individual thread creation
    const results = await store.rollMultiple(slot.oracleTableIds, undefined, true)

    if (!results || results.length !== 2) {
        console.error('[executeMacro] Failed to get results for oracle tables:', slot.oracleTableIds);
        return
    }

    // Helper to format result
    const formatRes = (res: any) => {
        return typeof res.result === 'string' ? res.result : JSON.stringify(res.result);
    }

    const combinedResult = `${formatRes(results[0])} + ${formatRes(results[1])}`
    const combinedRolls = [...results[0].rolls, ...results[1].rolls]

    // Import store to add card
    const { useSessionStore } = await import('../../stores/useSessionStore')
    const { createOracleCard } = await import('../../utils/threadCardFactory')

    const { activeSessionId, addCard } = useSessionStore.getState()

    if (activeSessionId) {
        const card = createOracleCard(activeSessionId, {
            tableId: 'macro-oracle', // Placeholder
            tableName: slot.oracleName || 'Oracle Macro',
            tableChain: slot.oracleTableNames || ['Unknown Tables'],
            rollValue: combinedRolls,
            result: combinedResult,
        })

        // Override content to show both full results
        card.content = [
            { label: slot.oracleTableNames?.[0] || 'Table 1', value: formatRes(results[0]) },
            { label: slot.oracleTableNames?.[1] || 'Table 2', value: formatRes(results[1]) },
            { label: 'Rolls', value: combinedRolls.join(', '), type: 'roll' }
        ]

        // Add meta
        card.meta = {
            ...card.meta,
            oracleName: slot.oracleName,
            tables: slot.oracleTableIds,
            results: results,
        }

        addCard(card)
        console.log('[executeMacro] Oracle Macro logged to session:', card);
    } else {
        console.warn('[executeMacro] No active session to log oracle macro');
    }
}

async function executeClockMacro(slot: MacroSlot): Promise<void> {
    if (!slot.clockId) return

    // Helper to get typed thread card
    const { useSessionStore } = await import('../../stores/useSessionStore')
    const { getCard, updateCard } = useSessionStore.getState()

    // In legacy macros, clockId/trackId was the thread ID
    const card = getCard(slot.clockId) as any // Cast to any or appropriate type if we have it

    if (!card || card.type !== 'clock' || !card.state) return

    const currentState = card.state as { filled: number, segments: number }
    const newFilled = Math.min(currentState.segments, currentState.filled + 1)

    if (newFilled !== currentState.filled) {
        updateCard(slot.clockId, {
            state: { ...currentState, filled: newFilled }
        })
    }
}

async function executeTrackMacro(slot: MacroSlot): Promise<void> {
    if (!slot.trackId) return

    const { useSessionStore } = await import('../../stores/useSessionStore')
    const { getCard, updateCard } = useSessionStore.getState()

    const card = getCard(slot.trackId) as any
    // const card = getCard(slot.trackId) as TrackThreadCard // Ideally use correct type import

    if (!card || card.type !== 'track' || !card.state) return

    const currentState = card.state as { filled: number, segments: number }
    const meta = card.meta as { difficulty?: string }

    // Default progress based on difficulty or standard 4 ticks
    const difficulty = meta?.difficulty || 'troublesome';
    let ticks = 4;
    switch (difficulty) {
        case 'troublesome': ticks = 12; break; // 3 boxes
        case 'dangerous': ticks = 8; break;    // 2 boxes
        case 'formidable': ticks = 4; break;   // 1 box
        case 'extreme': ticks = 2; break;      // 0.5 box
        case 'epic': ticks = 1; break;         // 0.25 box
    }

    const newFilled = Math.min(40, currentState.filled + ticks)

    if (newFilled !== currentState.filled) {
        updateCard(slot.trackId, {
            state: { ...currentState, filled: newFilled }
        })
    }
}
