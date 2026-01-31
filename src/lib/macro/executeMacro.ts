import { MacroSlot } from '../../types/macro'
import { useEditorStore } from '../../stores/useEditorStore'
import { diceEngine } from '../../integrations/anvil-dice-app'


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

    // Import dice engine logic only (helper)
    const { rollDiceExpression } = await import('../../core/dice/diceEngine')

    // Check if 3D engine is active BEFORE rolling. 
    // We use the static import singleton to ensure identity match with Overlay.
    const is3dEngineActive = !!diceEngine.getEngineCore();
    console.log('[executeDiceMacro] is3dEngineActive:', is3dEngineActive);

    // Check if DiceOverlay is actually mounted/listening (implicitly by engine check)
    // There is a race condition where getEngineCore is true but listeners aren't ready?
    // Unlikely if it's a singleton initialized in App root.

    const result = await rollDiceExpression(slot.diceExpression)

    // If the 3D engine handled the roll, DiceOverlay has already logged it.
    // We only manually log if we fell back to the non-3D calculator.
    if (is3dEngineActive) return;

    // Manual logging for fallback/headless mode
    const { useSessionStore } = await import('../../stores/useSessionStore')
    const { createDiceCard } = await import('../../utils/threadCardFactory')

    const { activeSessionId, addCard } = useSessionStore.getState()

    if (activeSessionId) {
        const card = createDiceCard(activeSessionId, {
            expression: slot.diceExpression,
            rolls: result.rolls.map((r: any) => r.value),
            total: result.total,
            modifier: 0,
        })
        addCard(card)
    }
}

async function executeTableMacro(slot: MacroSlot): Promise<void> {
    if (!slot.tableId) return

    const { useWeaveStore } = await import('../../stores/useWeaveStore')

    const store = useWeaveStore.getState();
    let table = store.tables.find(t => t.id === slot.tableId);

    // Fallback: If ID not found, try to fuzzy match by Name (handling the Haunted Catacombs case)
    if (!table && (slot.tableName || slot.label)) {
        const targetName = slot.tableName || slot.label;
        // Try exact match in-memory first
        table = store.tables.find(t => t.name === targetName);

        if (!table && targetName) {
            console.log(`[Macro] ID lookup failed for ${slot.tableId}, tried name match for "${targetName}" -> Not Found in Store. Checking Disk...`);

            try {
                const { WeaveService } = await import('../../core/weave/WeaveService');

                // Fetch ALL available tables (User + Environment)
                // This is heavier but necessary for repair
                const [userTables, envTables] = await Promise.all([
                    WeaveService.getTables(),
                    WeaveService.getEnvironmentTables()
                ]);

                const allTables = [...(userTables.tables || []), ...(envTables.tables || [])];

                // Search in full list
                table = allTables.find(t => t.name === targetName);

                if (table) {
                    console.log(`[Macro] FOUND "${targetName}" on disk with ID: ${table.id}. Using this ID.`);
                    // Optional: Modify slot in store to fix future clicks? 
                    // Cannot easily do that from here without the store action.
                }
            } catch (diskErr) {
                console.warn('[Macro] Failed to search disk for table name:', diskErr);
            }
        }
    }

    if (!table) {
        // Try loading if not in store (standard path for valid IDs)
        const { WeaveService } = await import('../../core/weave/WeaveService');
        try {
            if (slot.tableId) {
                // Wrapper to catch ID load errors
                table = await WeaveService.loadTable(slot.tableId);
            }
        } catch (err) {
            console.warn(`[Macro] Failed to load table by ID: ${slot.tableId}`, err);
        }
    }

    if (!table) {
        console.warn(`[Macro] Table load returned null: ${slot.tableId} (${slot.tableName})`);
        return;
    }

    // Use the central store action which now handles 3D dice and logging internally
    // We pass silent=false (default) to enable 3D dice and logging
    await store.rollTable(table.id);
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

    // We want 3D dice (silent=false) but we suppress individual table cards
    // because we will create one combined Oracle card at the end.
    const results = await store.rollMultiple(
        slot.oracleTableIds,
        { suppressLogging: true },
        false
    );

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
