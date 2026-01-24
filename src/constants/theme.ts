export const ThreadColors: Record<string, string> = {
    dice: '#d4a574',        // Gold
    interpretation: '#9d8cca', // Amethyst (Oracle)
    ai: '#c77dba',          // Ruby
    user: '#f0e6d3',        // Ivory (Voice/User)
    chat: '#f0e6d3',        // Ivory (Legacy)
    system: '#6b9edd',      // Sapphire (System/Links)
    weave: '#9d8cca',       // Amethyst (Weave)
    clock: '#a67c52',       // Antique Bronze (Time)
    track: '#7ec9a2',       // Jade (Progress)
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
