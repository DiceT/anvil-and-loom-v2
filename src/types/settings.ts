export type MaterialPreset = 'plastic' | 'metal' | 'wood' | 'glass';
export type SurfaceType = 'felt' | 'wood' | 'metal';
export type DiceSetType = 'chamfered' | 'rounded' | 'sharp' | 'stamped' | 'valkyrie';

// Dice Settings
export interface DiceSettings {
    diceColor: string;
    numberColor: string;
    material: MaterialPreset;
    surfaceType: SurfaceType;
    diceSet: DiceSetType;
    logToEntry: boolean; // Toggle for logging results to active entry
}

export const defaultDiceSettings: DiceSettings = {
    diceColor: '#8b5cf6',
    numberColor: '#ffffff',
    material: 'plastic',
    surfaceType: 'felt',
    diceSet: 'chamfered',
    logToEntry: true, // Default to enabled
};

// Editor Settings
export type EditorTheme = 'nord-dark' | 'nord-light';

export interface EditorSettings {
    // Theme
    theme: EditorTheme;

    // Core markdown behavior
    enableCommonmark: boolean;
    enableGfm: boolean;

    // Milkdown/Crepe plugins
    enableTables: boolean;
    enableTaskLists: boolean;
    enableStrikethrough: boolean;

    enableHistory: boolean;
    enableClipboard: boolean;
    enableIndent: boolean;
    enableCursorEnhancements: boolean;

    enableTooltip: boolean;
    enableSlashMenu: boolean;
    enableEmoji: boolean;
    enableUpload: boolean;
    enablePrismHighlight: boolean;
    enableTableControls: boolean;

    // Editor behavior
    showToolbar: boolean;
    showInlineMarkdownHints: boolean;
    syncOnChange: boolean;
    devModeOverrides: boolean;

    // Experimental features


    // Future/Stub
    enableCollaboration: boolean;
}

export const defaultEditorSettings: EditorSettings = {
    theme: 'nord-dark',
    enableCommonmark: true,
    enableGfm: true,

    enableTables: true,
    enableTaskLists: true,
    enableStrikethrough: true,

    enableHistory: true,
    enableClipboard: true,
    enableIndent: true,
    enableCursorEnhancements: true,

    enableTooltip: true,
    enableSlashMenu: true,
    enableEmoji: true,
    enableUpload: false,
    enablePrismHighlight: false,
    enableTableControls: true,

    enableCollaboration: false,

    showToolbar: true,
    showInlineMarkdownHints: false,
    syncOnChange: true,
    devModeOverrides: false,


};

// Global Settings
export interface GlobalSettings {
    dice: DiceSettings;
    editor: EditorSettings;
}

export const defaultGlobalSettings: GlobalSettings = {
    dice: defaultDiceSettings,
    editor: defaultEditorSettings,
};
