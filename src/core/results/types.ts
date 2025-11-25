export type ResultSource =
  | 'dice'
  | 'aspect'
  | 'domain'
  | 'table'
  | 'oracle'
  | 'interpretation'
  | 'system'
  | 'other';

export interface ResultCard {
  id: string;
  timestamp: string; // ISO format
  header: string; // e.g., "Dice Roll", "Oracle: Action + Theme"
  result: string; // The snapshot (what the user acts on)
  content: string; // Meta (how we got there, breakdowns, raw values)
  source?: ResultSource;
  meta?: Record<string, unknown>;
}
