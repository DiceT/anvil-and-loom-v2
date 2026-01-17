/**
 * Weave Types
 * 
 * Core data types for the Weave integration.
 * Copied from the-weave/src/engine/ with adaptations for anvil-and-loom-v2.
 */

// ============================================================================
// Table Types
// ============================================================================

export interface SchemaField {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
}

export interface TableSchema {
    name: string;
    description: string;
    fields: SchemaField[];
}

export interface Table {
    /** Unique identifier (UUIDv4) */
    id: string;

    /** Schema version for migration support */
    schemaVersion: number;

    /** Filesystem path where this table is stored */
    sourcePath: string;

    /** Optional semantic grouping (e.g., "oracle", "encounter") */
    tableType?: string;

    /** Optional UI-only category for organization */
    category?: string;

    /** Display name of the table */
    name: string;

    /** Tags used for table reference resolution */
    tags: string[];

    /** Description of the table (used by AI) */
    description: string;

    /** Numeric domain for rolling (e.g., 100, 66, 88) */
    maxRoll: number;

    /** Column headers for display (default: ["ROLL", "RESULT"]) */
    headers: string[];

    /** The actual table data rows */
    tableData: TableRow[];

    /** Optional object schema for structured results */
    schema?: TableSchema;
}

/** Default headers for new tables */
export const DEFAULT_HEADERS = ['ROLL', 'RESULT'];

/** Current schema version */
export const CURRENT_SCHEMA_VERSION = 1;

// ============================================================================
// Table Row Types
// ============================================================================

/** Result type discriminator for TableRow */
export type ResultType = 'text' | 'table' | 'object';

/** Reference to another table by tag */
export interface TableReference {
    tag: string;
}

/** Arbitrary JSON object for object-type results */
export type ObjectResult = Record<string, unknown>;

/** Union type for all possible result values */
export type ResultValue = string | TableReference | ObjectResult;

export interface TableRow {
    /** Lower bound of the roll range (inclusive) */
    floor: number;

    /** Upper bound of the roll range (inclusive) */
    ceiling: number;

    /** 
     * Editor-facing weight hint. 
     * Used for smart numbering suggestions only - never authoritative for rolling.
     */
    weight?: number;

    /** Type of result: text, table reference, or object */
    resultType: ResultType;

    /** The actual result value */
    result: ResultValue;
}

// ============================================================================
// Roll Result Types
// ============================================================================

export interface RollResult {
    /** The RNG seed used for this roll (for reproducibility) */
    seed: string;

    /** Chain of table names/IDs traversed during resolution */
    tableChain: string[];

    /** Numeric roll values at each step */
    rolls: number[];

    /** Any warnings generated (gaps, duplicates, etc.) */
    warnings: string[];

    /** The final resolved result (can include TableReference before token resolution) */
    result: ResultValue;
}

// ============================================================================
// Roll Options Types
// ============================================================================

export interface RollOptions {
    /** 
     * Seed for deterministic RNG. 
     * If not provided, a new seed is generated.
     */
    seed?: string;

    /** 
     * Force a specific roll value.
     * When provided, RNG is bypassed entirely (for external dice engines).
     */
    rollValue?: number;
}

// ============================================================================
// Roll Mode Types
// ============================================================================

/** Roll mode determines how the roll value is generated */
export type RollMode = 'standard' | 'd66' | 'd88' | '2d6' | '2d8' | '2d10' | '2d12' | '2d20';

// ============================================================================
// Token Resolver Types
// ============================================================================

/** Callback type for rolling a table by tag */
export type RollByTagCallback = (tag: string) => RollResult | null;

/** Error callback type */
export type ErrorCallback = (message: string, context?: Record<string, unknown>) => void;

export interface ResolverContext {
    /** Current recursion depth */
    depth: number;
    /** Tags visited in current resolution chain (for cycle detection) */
    visitedTags: Set<string>;
    /** Accumulated table chain */
    tableChain: string[];
    /** Accumulated roll values */
    rolls: number[];
    /** Accumulated warnings */
    warnings: string[];
}

// ============================================================================
// Weave Service Types (for IPC)
// ============================================================================

export interface WeaveTableListResponse {
    tables: Table[];
    error?: string;
}

export interface WeaveTableResponse {
    table: Table | null;
    error?: string;
}

export interface WeaveSaveTableResponse {
    success: boolean;
    table?: Table;
    error?: string;
}

export interface WeaveDeleteTableResponse {
    success: boolean;
    error?: string;
}

export interface WeaveRollResponse {
    result: RollResult | null;
    error?: string;
}

export interface WeaveSetTapestryPathResponse {
    success: boolean;
    error?: string;
}
