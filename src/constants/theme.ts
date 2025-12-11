export const ThreadColors: Record<string, string> = {
    dice: '#222244',        // Deep Blue
    aspect: '#224433',      // Forest Green
    domain: '#224433',      // Forest Green
    table: '#224422',       // Dark Green
    oracle: '#332244',      // Deep Purple
    interpretation: '#442244', // Magenta-ish
    ai: '#442244',          // Magenta-ish
    weave: '#685431',       // Gold/Brown
    user: '#0f52ba',        // Sapphire Blue (Distinct from Dice/Oracle)
    chat: '#0f52ba',        // Legacy alias for user
    system: '#1e293b',      // Slate
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
