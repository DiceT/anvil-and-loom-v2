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

/**
 * StoryPage and StoryBlock types for narrative text editing in Weaves.
 *
 * A StoryPage is a container for narrative content and threads within a Weave,
 * allowing users to write markdown text blocks interspersed between thread cards.
 */

export type StoryBlock =
  | {
      id: string;
      kind: 'text';
      markdown: string;  // markdown content for narrative text
    }
  | {
      id: string;
      kind: 'thread';
      threadId: string;  // reference to a Thread by ID
    };

export interface StoryPage {
  id: string;                 // must match weave.id for persistence
  title: string;              // inherits from weave.name but can be customized
  weaveId?: string;           // reference back to parent Weave
  aspectIds?: string[];       // IDs of selected Aspect packs
  domainIds?: string[];       // IDs of selected Domain packs
  blocks: StoryBlock[];       // ordered sequence of text and thread blocks
  threads?: string[];         // fallback for backward compatibility: thread IDs
  createdAt: string;          // ISO datetime
  updatedAt: string;          // ISO datetime
}
