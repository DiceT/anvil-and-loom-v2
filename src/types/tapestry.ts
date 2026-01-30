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
    | 'place'
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

export interface PanelFrontmatter {
    id: string;
    title: string;
    category: EntryCategory;
    tags?: string[];
    firstLookDone?: boolean; // Whether First Look has been run
}

export interface PanelDoc {
    id: string;
    path: string;
    title: string;
    category: EntryCategory;
    content: string;         // raw markdown, frontmatter stripped
    frontmatter: PanelFrontmatter;
    isDirty: boolean;
}

// Legacy alias for compatibility
export type EntryFrontmatter = PanelFrontmatter;
export type EntryDoc = PanelDoc;

export type NodeType = 'folder' | 'entry' | 'asset';

export interface TapestryNode {
    id: string;                // stable ID (e.g., frontmatter id or derived from path)
    type: NodeType;
    name: string;              // display name
    path: string;              // absolute path
    category?: EntryCategory;  // for 'entry' type nodes
    tags?: string[];           // for 'entry' type nodes
    children?: TapestryNode[];
}

export interface FolderOrder {
    entries: string[];   // file/folder names, in desired order
}

// Editor state types
export type EditorMode = 'edit' | 'view' | 'source';

export interface EditorState {
    mode: EditorMode;
    openEntries: EntryDoc[];
    activeEntryId?: string;
}

// [Legacy thread types removed]

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
    path?: string;
}
