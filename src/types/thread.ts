/**
 * Thread — The atomic unit of narrative truth
 * 
 * Every meaningful action creates a Thread.
 * Threads are immutable once created.
 * Threads are the audit log of play.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core Enums
// ─────────────────────────────────────────────────────────────────────────────

/** What kind of content this Thread represents */
export type ThreadType =
    | 'roll'        // Dice roll result
    | 'oracle'      // Table/oracle result  
    | 'ai_text'     // AI-generated text interpretation
    | 'ai_image'    // AI-generated image (v1.1)
    | 'user'        // User-authored content
    | 'system';     // System-generated (clock tick, track advance, etc.)

/** The narrative intent of this Thread */
export type ThreadIntent =
    | 'prompt'      // Asking a question, seeking direction
    | 'consequence' // Result of an action, something happened
    | 'canon'       // Established fact, committed to the narrative
    | 'meta'        // Out-of-character note, reminder, bookmark
    | 'prep';       // GM prep, not yet revealed

/** Where this Thread originated */
export type ThreadSource =
    | 'dice'        // Dice tray roll
    | 'weave'       // Random table roll
    | 'ai'          // AI interpretation/generation
    | 'user'        // Manual user entry
    | 'clock'       // Clock system event
    | 'track'       // Progress track event
    | 'system';     // Internal system event

/** Visibility state for this Thread */
export type ThreadVisibility =
    | 'visible'     // Fully revealed
    | 'hidden'      // Exists but not shown (GM eyes only)
    | 'foreshadowed'// Hinted at, partially revealed
    | 'resolved';   // Completed, archived but retained

// ─────────────────────────────────────────────────────────────────────────────
// Target References
// ─────────────────────────────────────────────────────────────────────────────

/** Links this Thread to other entities */
export interface ThreadTargets {
    /** Panel IDs this Thread relates to */
    panelIds?: string[];
    /** Clock IDs this Thread affects */
    clockIds?: string[];
    /** Progress Track IDs this Thread affects */
    trackIds?: string[];
    /** Entity references (NPCs, Places, etc.) */
    entityRefs?: EntityRef[];
}

export interface EntityRef {
    type: 'npc' | 'place' | 'faction' | 'relic' | 'other';
    id: string;
    name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock & Track References (embedded in Thread)
// ─────────────────────────────────────────────────────────────────────────────

export interface ThreadClock {
    id: string;
    name: string;
    segments: number;      // Total segments (4, 6, 8)
    filled: number;        // Currently filled
    trigger: 'sessions' | 'time' | 'manual';
    linkedPanelId?: string;
    isEditing?: boolean; // UI state for segment editing
}

export interface ThreadTrack {
    id: string;
    name: string;
    segments: number;
    filled: number;
    difficulty?: 'standard' | 'troublesome' | 'dangerous' | 'formidable' | 'extreme' | 'epic';
    linkedPanelId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Interpretation (attached to Thread)
// ─────────────────────────────────────────────────────────────────────────────

export interface ThreadAiInterpretation {
    id: string;
    personaId: string;
    personaName: string;
    content: string;
    timestamp: string;
    status: 'pending' | 'accepted' | 'rejected';
}

// ─────────────────────────────────────────────────────────────────────────────
// Dice Roll Metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface DiceRollBreakdown {
    die: string;                  // "d6"
    value: number;
    kept: boolean;                // For advantage/disadvantage
}

export interface DiceRollMeta {
    expression: string;           // "2d6+3"
    breakdown: DiceRollBreakdown[];
    total: number;
    modifier?: number;
    advantage?: 'advantage' | 'disadvantage' | 'none';
}


// ─────────────────────────────────────────────────────────────────────────────
// Weave Roll Metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface WeaveRollMeta {
    tableId: string;
    tableName: string;
    rollValue: number;
    weight?: number;
    rowIndex: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// The Thread Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface Thread {
    // ─── Identity ───
    id: string;                   // UUID
    timestamp: string;            // ISO 8601

    // ─── Classification ───
    type: ThreadType;
    intent: ThreadIntent;
    source: ThreadSource;
    visibility: ThreadVisibility;

    // ─── Content ───
    header: string;               // Display title ("Dice Roll", "Oracle: Action + Theme")
    summary: string;              // The result — what the user acts on
    content?: string;             // Expanded detail — how we got there (collapsible)

    // ─── Metadata ───
    meta?: {
        dice?: DiceRollMeta;
        weave?: WeaveRollMeta;
        expression?: string;        // Original input expression
        [key: string]: unknown;     // Extensible
    };

    // ─── Relationships ───
    targets?: ThreadTargets;
    parentThreadId?: string;      // If this Thread was spawned by another

    // ─── Embedded State ───
    clock?: ThreadClock;          // If this Thread has/is a clock
    track?: ThreadTrack;          // If this Thread has/is a progress track

    // ─── AI ───
    aiInterpretations?: ThreadAiInterpretation[];

    // ─── Audit ───
    createdBy: 'user' | 'system' | 'ai';
    sessionId?: string;           // Session this Thread belongs to
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

export function createThreadId(): string {
    return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createThread(partial: Partial<Thread> & Pick<Thread, 'type' | 'source' | 'header' | 'summary'>): Thread {
    return {
        id: createThreadId(),
        timestamp: new Date().toISOString(),
        intent: 'consequence',
        visibility: 'visible',
        createdBy: 'system',
        ...partial,
    };
}
