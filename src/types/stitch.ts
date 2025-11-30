
export interface StitchReference {
    sourceId: string;
    sourceTitle: string;
    targetTitle: string;
    anchor: string;
    context: string; // Snippet of text around the stitch
}

export interface StitchIndex {
    // Map of Panel ID -> List of outgoing stitches (target titles)
    outgoing: Record<string, string[]>;

    // Map of Panel Title (normalized) -> List of incoming references
    incoming: Record<string, StitchReference[]>;
}
