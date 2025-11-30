
export interface Stitch {
    raw: string;      // The full match: "[[Target|Label]]"
    target: string;   // The target panel name: "Target"
    anchor: string;   // The visible text: "Label" (or "Target" if no label)
    start: number;    // Start index in content
    end: number;      // End index in content
}

/**
 * Extracts all stitches (wikilinks) from the given content.
 * Supports [[Target]] and [[Target|Label]] formats.
 */
export function extractStitches(content: string): Stitch[] {
    // Match [[Target]] or [[Target|Label]], optionally escaped as \[\[...\]\]
    const regex = /(?:\\?\[){2}(.*?)(?:\|(.*?))?(?:\\?\]){2}/g;
    const stitches: Stitch[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        const [raw, target, label] = match;
        stitches.push({
            raw,
            target: target.trim(),
            anchor: (label || target).trim(),
            start: match.index,
            end: match.index + raw.length,
        });
    }

    return stitches;
}
