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

    // Construct new Thread
    return {
        id: legacy.id,
        timestamp: legacy.timestamp,

        type,
        intent: 'consequence', // Default assumption for history items
        source,
        visibility: 'visible',

        header: legacy.header,
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
        if (panelThread.source.toLowerCase().includes('dice')) source = 'dice';
    }

    return {
        id: panelThread.id,
        timestamp: panelThread.timestamp,

        type,
        intent: 'consequence',
        source,
        visibility: 'visible',

        header: panelThread.source || 'Thread', // Panel thread uses 'source' often as header
        summary: panelThread.summary,
        content: panelThread.content,

        meta: {
            expression: panelThread.expression,
            payload: panelThread.payload,
            // Lift dice meta: check if it's nested OR if the payload itself looks like dice data
            dice: panelThread.payload?.dice || (panelThread.payload && (panelThread.payload.breakdown || panelThread.payload.total !== undefined) ? panelThread.payload : undefined),
        },

        aiInterpretations: panelThread.aiInterpretations?.map(i => ({
            id: i.id,
            personaId: i.personaId,
            personaName: i.personaName,
            content: i.content,
            timestamp: i.timestamp,
            status: 'accepted' // Assume existing interpretations are accepted
        })),

        // Hoist embedded components from payload
        clock: panelThread.payload?.clock,
        track: panelThread.payload?.track,

        createdBy: panelThread.type === 'user' ? 'user' : 'system',
    };
}
