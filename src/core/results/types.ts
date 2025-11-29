export type ResultSource =
  | 'dice'
  | 'aspect'
  | 'domain'
  | 'table'
  | 'oracle'
  | 'interpretation'
  | 'system'
  | 'weave'
  | 'other';

/**
 * Thread
 *
 * Canonical model for a single outcome/beat in play.
 * Historically called ResultCard; ResultCard is now an alias of Thread.
 */
export interface Thread {
  id: string;
  timestamp: string; // ISO format
  header: string; // e.g., "Dice Roll", "Oracle: Action + Theme"
  result: string; // The snapshot (what the user acts on)
  content: string; // Meta (how we got there, breakdowns, raw values)
  source?: ResultSource;
  meta?: Record<string, unknown>;
}

/**
 * Legacy alias: ResultCard is now defined as a Thread.
 * Prefer Thread in new code.
 */
export type ResultCard = Thread;
