export type WeaveTargetType = 'oracle' | 'oracleCombo' | 'aspect' | 'domain';

export interface WeaveRow {
  id: string;        // local row UUID for UI
  from: number;      // inclusive
  to: number;        // inclusive
  targetType: WeaveTargetType;
  targetId: string;  // ID resolvable by TableRegistry or known oracle IDs
}

export interface Weave {
  id: string;        // slug / filename-safe
  name: string;
  author: string;
  maxRoll: number;   // die size: 10, 20, 100, etc
  rows: WeaveRow[];
  createdAt: string;
  updatedAt: string;
  readOnly?: boolean; // If true, prevent editing and deletion
}

export interface WeaveRegistry {
  weaves: Map<string, Weave>;
}
