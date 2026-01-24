/**
 * Thread Adapters
 * 
 * Functions to convert legacy thread types to the new Unified Thread model.
 */

import { Thread as LegacyThread } from '../../core/results/types';
import { PanelThreadModel } from '../../types/tapestry';
import {
    Thread,
    ThreadType,
    ThreadSource,
    ThreadIntent,
    ThreadVisibility
} from '../../types/thread';

/**
 * Converts a Legacy Thread (from Thread History) to new Thread
 */
export function legacyThreadToThread(legacy: LegacyThread): Thread {
    let type: ThreadType = 'system';
    let source: ThreadSource = 'system';

    // Map Source/Type
    switch (legacy.source) {
        case 'dice':
            type = 'roll';
            source = 'dice';
            break;
        case 'weave':
            type = 'oracle';
            source = 'weave';
            break;
        case 'interpretation':
            type = 'ai_text';
            source = 'ai';
            break;
        case 'user':
            type = 'user';
            source = 'user';
            break;
        default:
            if (legacy.header?.toLowerCase().includes('roll')) {
                type = 'roll';
                source = 'dice';
            }
            break;
    }

    // Explicit check for embedded data (Legacy objects often store these directly or in meta)
    if ((legacy as any).clock || legacy.meta?.clock) source = 'clock';
    if ((legacy as any).track || legacy.meta?.track) source = 'track';

    // Fix lowercase headers or ALL CAPS 'DICE'
    let header = legacy.header || 'Thread';
    if (source === 'dice') {
        header = header.replace(/^DICE/i, 'Dice');
    } else if (source === 'clock') {
        const clock = (legacy as any).clock || legacy.meta?.clock;
        const filled = clock?.filled || 0;
        const segments = clock?.segments || 4;
        header = `Clock ${filled}/${segments}`;
    } else if (source === 'track') {
        const track = (legacy as any).track || legacy.meta?.track;
        const filled = track?.filled || 0;
        const boxes = Math.floor(filled / 4);
        header = `Track ${boxes}/10`;
    }

    // Construct new Thread
    return {
        id: legacy.id,
        timestamp: legacy.timestamp,

        type,
        intent: 'consequence', // Default assumption for history items
        source,
        visibility: 'visible',

        header,
        summary: legacy.result, // Legacy 'result' is the summary
        content: legacy.content,

        meta: legacy.meta ? { ...legacy.meta } : undefined,

        // Preserve new unified fields if they exist in the "legacy" object
        // (This happens when we store a new Thread in the old store/type)
        clock: (legacy as any).clock,
        track: (legacy as any).track,
        aiInterpretations: (legacy as any).aiInterpretations,

        createdBy: legacy.source === 'user' ? 'user' : 'system',
    };
}

/**
 * Converts a Panel Thread (Milkdow embedded) to new Thread
 */
export function panelThreadToThread(panelThread: PanelThreadModel): Thread {
    let type: ThreadType = 'system';
    let source: ThreadSource = 'system';

    // Map Type
    switch (panelThread.type) {
        case 'dice':
            type = 'roll';
            source = 'dice';
            break;
        case 'ai':
        case 'interpretation':
            type = 'ai_text';
            source = 'ai';
            break;
        case 'oracle':
            type = 'oracle';
            source = 'weave';
            break;
        case 'user':
            // Check if it's actually an Oracle result masquerading as User type
            if (panelThread.payload?.weave) {
                type = 'oracle';
                source = 'weave';
            } else {
                type = 'user';
                source = 'user';
            }
            break;
    }

    // Check source string for backup
    if (panelThread.source && panelThread.type as string !== 'user') {
        const lowerSource = panelThread.source.toLowerCase();
        if (lowerSource.includes('dice')) source = 'dice';
        if (lowerSource.includes('clock')) source = 'clock';
        if (lowerSource.includes('track')) source = 'track';
    }

    // Explicit check for payload data (stronger signal)
    if (panelThread.payload?.clock) source = 'clock';
    if (panelThread.payload?.track) source = 'track';

    // Construct Header
    let header = panelThread.source || 'Thread';

    // Fix Casing and Format
    if (source === 'dice') {
        header = header.replace(/^DICE/i, 'Dice');
    } else if (source === 'clock') {
        const filled = panelThread.payload?.clock?.filled || 0;
        const segments = panelThread.payload?.clock?.segments || 4;
        header = `Clock ${filled}/${segments}`;
    } else if (source === 'track') {
        // "Track [x]/10"
        const filled = panelThread.payload?.track?.filled || 0;
        const boxes = Math.floor(filled / 4);
        header = `Track ${boxes}/10`;
    }

    return {
        id: panelThread.id,
        timestamp: panelThread.timestamp,

        type,
        intent: 'consequence',
        source,
        visibility: 'visible',

        header,
        summary: panelThread.summary,
        content: panelThread.content,

        meta: {
            expression: panelThread.expression,
            payload: panelThread.payload,
            // Lift dice meta: check if it's nested OR if the payload itself looks like dice data
            dice: panelThread.payload?.dice || (panelThread.payload && (panelThread.payload.breakdown || panelThread.payload.total !== undefined) ? panelThread.payload : undefined),
        },

        aiInterpretations: panelThread.aiInterpretations?.map((i, idx) => ({
            id: (i as any).id || `ai_interp_${idx}_${Date.now()}`, // Fallback ID
            personaId: i.personaId,
            personaName: i.personaName,
            content: i.content,
            timestamp: (i as any).timestamp || i.createdAt || new Date().toISOString(), // Fallback timestamp mapping
            status: 'accepted' // Assume existing interpretations are accepted
        })),

        // Hoist embedded components from payload
        clock: panelThread.payload?.clock,
        track: panelThread.payload?.track,

        createdBy: panelThread.type === 'user' ? 'user' : 'system',
    };
}
