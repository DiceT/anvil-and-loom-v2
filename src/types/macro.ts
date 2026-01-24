
// ─────────────────────────────────────────────────────────────────────────────
// Macro Types
// ─────────────────────────────────────────────────────────────────────────────

export type MacroType =
    | 'dice'
    | 'table'
    | 'panel'
    | 'oracle'
    | 'clock'
    | 'track'
    | 'empty'

// ─────────────────────────────────────────────────────────────────────────────
// Macro Slot
// ─────────────────────────────────────────────────────────────────────────────

export interface MacroSlot {
    id: string
    index: number           // 0-31 absolute position
    type: MacroType
    label: string           // Display name (truncated to ~6 chars)

    // ─── Dice ───
    diceExpression?: string       // "2d6+1", "d20", etc.

    // ─── Table ───
    tableId?: string
    tableName?: string

    // ─── Panel ───
    panelId?: string
    panelPath?: string
    panelTitle?: string

    // ─── Oracle (paired tables) ───
    oracleName?: string           // "Action + Theme"
    oracleTableIds?: [string, string]
    oracleTableNames?: [string, string]

    // ─── Clock ───
    clockId?: string
    clockName?: string

    // ─── Track ───
    trackId?: string
    trackName?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

export function createEmptySlot(index: number): MacroSlot {
    return {
        id: `macro_${index}`,
        index,
        type: 'empty',
        label: '',
    }
}

export function createDiceMacro(index: number, expression: string): MacroSlot {
    return {
        id: `macro_${index}_${Date.now()}`,
        index,
        type: 'dice',
        label: expression.length > 6 ? expression.slice(0, 5) + '…' : expression,
        diceExpression: expression,
    }
}

export function createTableMacro(index: number, tableId: string, tableName: string): MacroSlot {
    return {
        id: `macro_${index}_${Date.now()}`,
        index,
        type: 'table',
        label: tableName.length > 6 ? tableName.slice(0, 5) + '…' : tableName,
        tableId,
        tableName,
    }
}

export function createPanelMacro(index: number, panelId: string, panelPath: string, panelTitle: string): MacroSlot {
    return {
        id: `macro_${index}_${Date.now()}`,
        index,
        type: 'panel',
        label: panelTitle.length > 6 ? panelTitle.slice(0, 5) + '…' : panelTitle,
        panelId,
        panelPath,
        panelTitle,
    }
}

export function createOracleMacro(
    index: number,
    name: string,
    tableIds: [string, string],
    tableNames: [string, string]
): MacroSlot {
    return {
        id: `macro_${index}_${Date.now()}`,
        index,
        type: 'oracle',
        label: name.length > 6 ? name.slice(0, 5) + '…' : name,
        oracleName: name,
        oracleTableIds: tableIds,
        oracleTableNames: tableNames,
    }
}

export function createClockMacro(index: number, clockId: string, clockName: string): MacroSlot {
    return {
        id: `macro_${index}_${Date.now()}`,
        index,
        type: 'clock',
        label: clockName.length > 6 ? clockName.slice(0, 5) + '…' : clockName,
        clockId,
        clockName,
    }
}

export function createTrackMacro(index: number, trackId: string, trackName: string): MacroSlot {
    return {
        id: `macro_${index}_${Date.now()}`,
        index,
        type: 'track',
        label: trackName.length > 6 ? trackName.slice(0, 5) + '…' : trackName,
        trackId,
        trackName,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────────────────────

export const SLOTS_PER_ROW = 8
export const TOTAL_ROWS = 4
export const TOTAL_SLOTS = SLOTS_PER_ROW * TOTAL_ROWS  // 32

export function createEmptyMacroBar(): MacroSlot[] {
    return Array.from({ length: TOTAL_SLOTS }, (_, i) => createEmptySlot(i))
}
