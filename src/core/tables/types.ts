/**
 * Table System Type Definitions
 *
 * Defines the structure for RollTables (Aspects, Domains, Oracles)
 * and related types for table loading, indexing, and resolution.
 */

// ============================================================================
// Table Row and Table Structure
// ============================================================================

export interface TableRow {
  floor: number;
  ceiling: number;
  result: string;
}

export interface RollTable {
  // Core identification
  id: string;              // Generated: "aspect:haunted:objectives" or "oracle:action"
  sourcePath: string;      // From JSON: "core-data/tables/oracles/action.json"
  name: string;            // Display name: "Action", "Objectives", etc.

  // Categorization
  tags: string[];          // ["oracle", "action"] or ["aspect", "objective"]
  category: string;        // "Oracle", "Aspect", "Domain"
  oracle_type?: string;    // "Action", "Objectives", "Atmosphere", etc.

  // Table data
  headers: string[];       // ["d100", "Result"]
  tableData: TableRow[];   // Array of floor/ceiling/result entries
  maxRoll: number;         // Usually 100

  // Metadata
  description?: string;    // Long description of the table
  summary?: string;        // Short summary
}

// ============================================================================
// Table Loading and Registry
// ============================================================================

export type TableSource = 'core' | 'user';

export interface TablePackMetadata {
  source: TableSource;
  category: 'aspect' | 'domain';
  packId: string;          // "haunted", "forest", etc.
  packName: string;        // Display name from JSON
  description?: string;
  tables: RollTable[];     // The 6 subtables for Aspects/Domains
}

export interface OracleTableMetadata {
  source: TableSource;
  table: RollTable;
}

export interface TableRegistry {
  // Aspect and Domain packs (multi-table files)
  aspectPacks: Map<string, TablePackMetadata>;  // key: "haunted", "blighted", etc.
  domainPacks: Map<string, TablePackMetadata>;  // key: "forest", "cemetery", etc.

  // Oracle tables (single-table files)
  oracles: Map<string, OracleTableMetadata>;    // key: "action", "theme", etc.

  // Fast lookup by table ID
  tablesById: Map<string, RollTable>;           // key: "aspect:haunted:objectives"

  // Tag index for oracles only (for ACTION+THEME combo resolution)
  oraclesByTag: Map<string, string[]>;          // key: "action", value: ["oracle:action", "oracle:custom-action"]
}

// ============================================================================
// Table Rolling
// ============================================================================

export interface TableRollResult {
  tableId: string;
  tableName: string;
  roll: number;
  result: string;
  isMacro: boolean;        // true if result is a macro like "ACTION + THEME"
  macroType?: MacroType;
}

export type MacroType =
  | 'ACTION_THEME'
  | 'DESCRIPTOR_FOCUS'
  | 'ROLL_TWICE'
  | 'OBJECTIVES'
  | 'THE_WEAVE';

// ============================================================================
// Table ID Utilities
// ============================================================================

export interface TableIdParts {
  type: 'aspect' | 'domain' | 'oracle';
  parent?: string;         // For subtables: "haunted", "forest"
  subtable?: string;       // For subtables: "objectives", "atmosphere"
  name: string;            // For oracles: "action", "theme"
}
