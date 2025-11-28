export interface TapestryRegistryEntry {
    id: string;          // uuid
    name: string;
    path: string;        // absolute path to tapestry root
    description?: string;
    imagePath?: string;  // optional world image/logo
    createdAt: string;   // ISO datetime
    updatedAt: string;   // ISO datetime
    lastOpenedAt?: string;
}

export interface TapestryRegistry {
    tapestries: TapestryRegistryEntry[];
}

export type EntryCategory =
    | 'world'
    | 'session'
    | 'npc'
    | 'lore'
    | 'mechanics'
    | 'other';

export interface TapestryConfig {
    id: string;                // same as registry entry id
    name: string;
    description?: string;
    imagePath?: string;
    defaultEntryCategory?: EntryCategory;
    theme?: {
        accentColor?: string;    // future: per-tapestry theming
    };
}

export interface EntryFrontmatter {
    id: string;
    title: string;
    category: EntryCategory;
    tags?: string[];
}

export interface EntryDoc {
    id: string;
    path: string;
    title: string;
    category: EntryCategory;
    content: string;         // raw markdown, frontmatter stripped
    frontmatter: EntryFrontmatter;
    isDirty: boolean;
}

export type NodeType = 'folder' | 'entry' | 'asset';

export interface TapestryNode {
    id: string;                // stable ID (e.g., frontmatter id or derived from path)
    type: NodeType;
    name: string;              // display name
    path: string;              // absolute path
    category?: EntryCategory;  // for 'entry' type nodes
    children?: TapestryNode[];
}

export interface FolderOrder {
    entries: string[];   // file/folder names, in desired order
}

// Editor state types
export type EditorMode = 'edit' | 'view';

export interface EditorState {
    mode: EditorMode;
    openEntries: EntryDoc[];
    activeEntryId?: string;
}

// Result Card types (for Phase 5)
export type ResultCardType = 'dice' | 'oracle' | 'weave' | 'aspect' | 'domain' | 'table';

export interface ResultCardModel {
    id: string;          // uuid
    type: ResultCardType;
    source: string;      // e.g. "Weave: Haunted Forest / Atmosphere"
    expression?: string; // dice expression, if any
    summary: string;     // short headline prompt
    content?: string;    // detailed content (roll info, etc)
    payload: any;        // detailed data, JSON-serializable
}

// Helper types for IPC
export interface CreateTapestryData {
    name: string;
    description?: string;
    imagePath?: string;
    basePath?: string;  // base directory for tapestry root
}

export interface UpdateTapestryData {
    name?: string;
    description?: string;
    imagePath?: string;
}
