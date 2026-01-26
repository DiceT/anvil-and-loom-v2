import { MacroSlot } from '../../types/macro'
import { logThread } from '../../core/results/threadEngine'
import { useEditorStore } from '../../stores/useEditorStore'
import { useThreadsStore } from '../../stores/useThreadsStore'
import { Thread } from '../../types/thread'

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

    // logThread({
    //     header: `Dice: ${slot.diceExpression}`,
    //     result: String(result.total),
    //     content: `Expression: ${slot.diceExpression}\nRolls: ${result.rolls.map((r: any) => r.value).join(', ')}`,
    //     source: 'dice',
    //     meta: {
    //         expression: slot.diceExpression,
    //         breakdown: result.rolls,
    //         total: result.total,
    //     },
    // })
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
    if (!slot.oracleTableIds || slot.oracleTableIds.length !== 2) return

    const { useWeaveStore } = await import('../../stores/useWeaveStore')
    const store = useWeaveStore.getState()

    // Pass silent=true to prevent individual thread creation
    const results = await store.rollMultiple(slot.oracleTableIds, undefined, true)

    if (!results || results.length !== 2) return

    // Helper to format result
    const formatRes = (res: any) => {
        return typeof res.result === 'string' ? res.result : JSON.stringify(res.result);
    }

    const combinedResult = `${formatRes(results[0])} + ${formatRes(results[1])}`

    logThread({
        header: `Oracle: ${slot.oracleName}`,
        result: combinedResult,
        content: `${slot.oracleTableNames?.[0]}: ${formatRes(results[0])}\n${slot.oracleTableNames?.[1]}: ${formatRes(results[1])}`,
        source: 'weave',
        meta: {
            oracleName: slot.oracleName,
            tables: slot.oracleTableIds,
            results: results,
        },
    })
}

async function executeClockMacro(slot: MacroSlot): Promise<void> {
    if (!slot.clockId) return

    const { threads, updateThread } = useThreadsStore.getState()
    // Cast generic threads to our specific Thread type if needed, 
    // but usage should define it correctly.
    const thread = threads.find(t => t.id === slot.clockId) as Thread | undefined

    if (!thread || !thread.clock) return

    const clock = thread.clock
    const newFilled = Math.min(clock.segments, clock.filled + 1)

    if (newFilled !== clock.filled) {
        updateThread(slot.clockId, { clock: { ...clock, filled: newFilled } })
    }
}

async function executeTrackMacro(slot: MacroSlot): Promise<void> {
    if (!slot.trackId) return

    const { threads, updateThread } = useThreadsStore.getState()
    const thread = threads.find(t => t.id === slot.trackId) as Thread | undefined

    if (!thread || !thread.track) return

    const track = thread.track
    // Default progress based on difficulty or standard 4 ticks
    const difficulty = track.difficulty || 'troublesome';
    let ticks = 4;
    switch (difficulty) {
        case 'troublesome': ticks = 12; break; // 3 boxes
        case 'dangerous': ticks = 8; break;    // 2 boxes
        case 'formidable': ticks = 4; break;   // 1 box
        case 'extreme': ticks = 2; break;      // 0.5 box
        case 'epic': ticks = 1; break;         // 0.25 box
    }

    const newFilled = Math.min(40, track.filled + ticks)

    if (newFilled !== track.filled) {
        updateThread(slot.trackId, { track: { ...track, filled: newFilled } })
    }
}
