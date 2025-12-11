
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

export interface PinStitch {
    targetId: string;
    label: string;
    blurb?: string;
}

/**
 * Extracts map pins from the JSON map data block.
 * Looks for ```json:map-data ... ``` and parses tokens.
 */
export function extractMapPins(content: string): PinStitch[] {
    const regex = /```json:map-data\s*([\s\S]*?)\s*```/;
    const match = content.match(regex);
    const pins: PinStitch[] = [];

    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            if (data.tokens && Array.isArray(data.tokens)) {
                data.tokens.forEach((token: any) => {
                    if (token.type === 'pin' && token.linkedEntryId) {
                        pins.push({
                            targetId: token.linkedEntryId,
                            label: token.label || 'Map Pin',
                            blurb: token.blurb
                        });
                    }
                });
            }
        } catch (e) {
            console.error('Failed to parse map data for stitches', e);
        }
    }

    return pins;
}
