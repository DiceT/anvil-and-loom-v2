export const ThreadColors: Record<string, string> = {
    dice: '#222244',        // Deep Blue
    interpretation: '#442244', // Magenta-ish
    ai: '#442244',          // Magenta-ish
    user: '#0f52ba',        // Sapphire Blue (Distinct from Dice)
    chat: '#0f52ba',        // Legacy alias for user
    system: '#1e293b',      // Slate
    weave: '#064e3b',       // Emerald Green (Forest Green)
    other: '#1e293b',       // Slate
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
