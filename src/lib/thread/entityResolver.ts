/**
 * Entity Resolver
 * 
 * Scans Thread content for entity references and creates links.
 */

import { Thread, EntityRef } from '../../types/thread';
import { useStitchStore } from '../../stores/useStitchStore';

/** Patterns to detect in Thread content */
const ENTITY_PATTERNS = {
    wikiLink: /\[\[([^\]]+)\]\]/g,           // [[Panel Name]]
    tableRef: /\{\{table:([^}]+)\}\}/g,      // {{table:Catacomb: Encounters}}
    panelRef: /\{\{panel:([^}]+)\}\}/g,      // {{panel:The Tear}}
};

/**
 * Resolves a category string/path to a EntityRef type.
 * Since the store doesn't strictly provide category, we infer from path or default.
 */
function resolvePanelCategory(path: string | undefined): EntityRef['type'] {
    if (!path) return 'other';
    const lower = path.toLowerCase();

    if (lower.includes('npc') || lower.includes('people')) return 'npc';
    if (lower.includes('location') || lower.includes('place')) return 'place';
    if (lower.includes('faction') || lower.includes('group')) return 'faction';
    if (lower.includes('relic') || lower.includes('item')) return 'relic';

    return 'other';
}

/** Extract entity references from Thread content */
export function extractEntityRefs(thread: Thread): EntityRef[] {
    const refs: EntityRef[] = [];
    const content = `${thread.header} ${thread.summary} ${thread.content || ''}`;

    // Wiki links
    let match;
    // Reset regex lastIndex to be safe
    ENTITY_PATTERNS.wikiLink.lastIndex = 0;

    while ((match = ENTITY_PATTERNS.wikiLink.exec(content)) !== null) {
        const name = match[1];
        const resolved = useStitchStore.getState().resolvePanel(name);
        if (resolved) {
            refs.push({
                type: resolvePanelCategory(resolved.path),
                id: resolved.id,
                name: name
            });
        }
    }

    return refs;
}

/** Detect table references in Thread content */
export function extractTableRefs(thread: Thread): string[] {
    const tables: string[] = [];
    const content = `${thread.summary} ${thread.content || ''}`;

    let match;
    ENTITY_PATTERNS.tableRef.lastIndex = 0;

    while ((match = ENTITY_PATTERNS.tableRef.exec(content)) !== null) {
        tables.push(match[1]);
    }

    // Also check weave meta
    if (thread.meta?.weave?.tableName) {
        tables.push(thread.meta.weave.tableName);
    }
    // Also check if type is oracle, check header/source? 
    // The roadmap logic was simple: check explicit detected refs + weave meta

    return tables;
}
