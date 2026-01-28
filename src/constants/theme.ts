export const ThreadColors: Record<string, string> = {
    dice: '#d4a574',        // Gold (Amber)
    interpretation: '#c77dba', // Ruby (Rose) - Alias for AI
    ai: '#c77dba',          // Ruby (Rose)
    user: '#5db3a1',        // Emerald (Teal)
    chat: '#5db3a1',        // Emerald (Alias)
    system: '#6b9edd',      // Sapphire (Blue)
    weave: '#9d8cca',       // Amethyst
    clock: '#a67c52',       // Antique Bronze
    track: '#7ec9a2',       // Jade
    other: '#252530',       // Panel/Slate
};

// Map legacy 'chat' to 'user' if needed, or just deprecate it.
// We will use 'user' going forward.

// Helper to ensure consistent color resolution across all components
// (Sidebar Cards, Panel Cards, etc.)
export function resolveThreadColor(source: string | undefined, type: string): string {
    // 1. Prefer strict source match first (e.g. 'user', 'dice')
    if (source && ThreadColors[source]) return ThreadColors[source];

    // 2. Fallback to type (e.g. 'chat' -> legacy mapping)
    if (type && ThreadColors[type]) return ThreadColors[type];

    // 3. Default
    return ThreadColors['other'];
}
