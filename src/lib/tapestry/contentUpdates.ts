/**
 * Helper to update a Thread's JSON payload within a Markdown string.
 * Used for syncing interactive state (Clocks/Tracks) to the document.
 */
export function updateThreadInContent(content: string, threadId: string, updates: any): string | null {
    const blockRegex = /```(thread-card|result-card)\s*([\s\S]*?)\s*```/g;
    let match;

    while ((match = blockRegex.exec(content)) !== null) {
        try {
            const jsonStr = match[2];
            const data = JSON.parse(jsonStr);

            // Check match. Supports legacy ID or timestamp matching if needed.
            if (data.id === threadId || data.timestamp === threadId) { // Fallback to timestamp if ID is used as such
                const fullMatch = match[0];
                const newData = { ...data };

                if (!newData.payload) newData.payload = {};

                if (updates.clock) {
                    newData.payload.clock = { ...newData.payload.clock, ...updates.clock };
                    // Also update summary if it was generated
                    if (newData.summary.startsWith('Clock "')) {
                        const c = newData.payload.clock;
                        newData.summary = `Clock "${c.name}" (${c.filled}/${c.segments})`;
                    }
                }
                if (updates.track) {
                    newData.payload.track = { ...newData.payload.track, ...updates.track };
                    if (newData.summary.startsWith('Track "')) {
                        const t = newData.payload.track;
                        newData.summary = `Track "${t.name}" (${t.filled}/${t.segments})`;
                    }
                }

                const newJson = JSON.stringify(newData, null, 2);
                const newBlock = `\`\`\`${match[1]}\n${newJson}\n\`\`\``;

                return content.replace(fullMatch, newBlock);
            }
        } catch (e) {
            // Ignore parse errors
        }
    }
    return null; // No match found
}
