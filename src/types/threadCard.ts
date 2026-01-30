// ─────────────────────────────────────────────────────────────────────────────
// Thread Card Type Definitions
// 
// The atomic unit of content in Anvil & Loom's Live Session system.
// Thread Cards capture dice rolls, oracle results, AI interpretations,
// user inputs, clocks, tracks, and system messages.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The type of Thread Card, determining its behavior and rendering.
 */
export type ThreadCardType =
  | 'dice'
  | 'oracle'
  | 'ai'
  | 'user'
  | 'clock'
  | 'track'
  | 'system';

/**
 * A single content block within a Thread Card.
 * Represents one step, mechanic, or piece of metadata.
 */
export interface ContentBlock {
  /** Optional label (e.g., "Expression:", "Tables:") */
  label?: string;
  /** The content value */
  value: string;
  /** Affects rendering style */
  type?: 'text' | 'code' | 'roll' | 'table-chain';
}

/**
 * An action button that can be displayed on a Thread Card.
 */
export interface ActionButton {
  /** Unique identifier within the card */
  id: string;
  /** Display label */
  label: string;
  /** Action key (handled by action dispatcher) */
  action: string;
  /** Parameters passed to the action */
  params?: Record<string, unknown>;
  /** Whether the action is currently disabled */
  disabled?: boolean;
}

/**
 * The Thread Card: atomic unit of the Live Session.
 * 
 * Structure:
 * - Header: Title/summary line with icon
 * - Content: Collapsible mechanics/steps (how we got here)
 * - Result: The visible outcome (what matters narratively)
 * - Actions: Interactive buttons (derived from type)
 */
export interface ThreadCard {
  // ─────────────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Unique identifier (UUID format) */
  id: string;
  
  /** ID of the session this card belongs to */
  sessionId: string;
  
  /** ISO 8601 timestamp of creation */
  timestamp: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Type
  // ─────────────────────────────────────────────────────────────────────────
  
  /** The card type, determines behavior and default actions */
  type: ThreadCardType;

  // ─────────────────────────────────────────────────────────────────────────
  // Display
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Header text (e.g., "🎲 Dice: 2d6+1", "🎴 Oracle: Aspect") */
  header: string;
  
  /** Optional icon override (emoji or icon key) */
  icon?: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Content
  // ─────────────────────────────────────────────────────────────────────────
  
  /** 
   * Collapsible content blocks showing mechanics/steps.
   * Hidden by default, revealed on header click.
   */
  content: ContentBlock[];
  
  /** 
   * The visible result/outcome.
   * This is what matters narratively.
   */
  result: string;

  // ─────────────────────────────────────────────────────────────────────────
  // State (Mutable)
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Mutable state for interactive cards (clocks, tracks).
   * Updated by user actions.
   */
  state?: Record<string, unknown>;

  // ─────────────────────────────────────────────────────────────────────────
  // Metadata (Immutable)
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * Type-specific immutable metadata.
   * Examples: roll breakdown, table chain, AI persona.
   */
  meta?: Record<string, unknown>;

  // ─────────────────────────────────────────────────────────────────────────
  // Organization
  // ─────────────────────────────────────────────────────────────────────────
  
  /** User-applied tags for filtering and curation */
  tags?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Type-Specific Metadata Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/** Metadata for dice roll cards */
export interface DiceCardMeta {
  expression: string;
  rolls: number[];
  modifier?: number;
  total: number;
  dc?: number;
  success?: boolean;
}

/** Metadata for oracle cards */
export interface OracleCardMeta {
  tableId: string;
  tableName: string;
  tableChain: string[];
  rollValue: number | number[];
}

/** Metadata for AI interpretation cards */
export interface AICardMeta {
  persona: string;
  model?: string;
  contextCards?: string[];
}

/** Metadata for clock cards */
export interface ClockCardMeta {
  trigger?: string;
}

/** Metadata for track cards */
export interface TrackCardMeta {
  difficulty?: string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type-Specific State Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/** State for clock cards */
export interface ClockCardState {
  segments: number;
  filled: number;
}

/** State for track cards */
export interface TrackCardState {
  segments: number;
  filled: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Types
// ─────────────────────────────────────────────────────────────────────────────

/** A Thread Card with typed meta for dice rolls */
export type DiceThreadCard = ThreadCard & {
  type: 'dice';
  meta: DiceCardMeta;
};

/** A Thread Card with typed meta for oracle results */
export type OracleThreadCard = ThreadCard & {
  type: 'oracle';
  meta: OracleCardMeta;
};

/** A Thread Card with typed meta for AI interpretations */
export type AIThreadCard = ThreadCard & {
  type: 'ai';
  meta: AICardMeta;
};

/** A Thread Card with typed state for clocks */
export type ClockThreadCard = ThreadCard & {
  type: 'clock';
  state: ClockCardState;
  meta?: ClockCardMeta;
};

/** A Thread Card with typed state for tracks */
export type TrackThreadCard = ThreadCard & {
  type: 'track';
  state: TrackCardState;
  meta?: TrackCardMeta;
};

/** A Thread Card for user input */
export type UserThreadCard = ThreadCard & {
  type: 'user';
};

/** A Thread Card for system messages */
export type SystemThreadCard = ThreadCard & {
  type: 'system';
};
