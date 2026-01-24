/**
 * Thread Analyzer
 * 
 * Analyzes a Thread to determine available actions.
 * This is the predicate system for the Action bar.
 */

import { Thread } from '../../types/thread';
import { extractTableRefs, extractEntityRefs } from './entityResolver';

export interface ThreadAnalysis {
    /** Can this Thread be interpreted by AI? */
    canInterpret: boolean;

    /** Can this Thread have a Clock attached? */
    canCreateClock: boolean;

    /** Can this Thread have a Progress Track attached? */
    canCreateTrack: boolean;

    /** Does this Thread reference rollable tables? */
    rollableTables: string[];

    /** Does this Thread reference linkable panels? */
    linkablePanels: { id: string; name: string }[];

    /** Does this Thread have pending AI interpretations? */
    hasPendingInterpretation: boolean;

    /** Does this Thread have an active Clock? */
    hasActiveClock: boolean;

    /** Does this Thread have an active Track? */
    hasActiveTrack: boolean;

    /** Is this Thread already committed to canon? */
    isCanon: boolean;
}

export function analyzeThread(thread: Thread): ThreadAnalysis {
    const tableRefs = extractTableRefs(thread);
    const entityRefs = extractEntityRefs(thread);

    return {
        // Can interpret if it's a roll/oracle result without accepted interpretation
        canInterpret:
            ['roll', 'oracle'].includes(thread.type) &&
            !thread.aiInterpretations?.some(i => i.status === 'accepted'),

        // Can create clock if no clock exists and it's a consequence
        canCreateClock:
            !thread.clock &&
            thread.intent === 'consequence',

        // Can create track if no track exists and it's a consequence
        canCreateTrack:
            !thread.track &&
            thread.intent === 'consequence',

        // Tables found in content
        rollableTables: tableRefs,

        // Panels found in content
        linkablePanels: entityRefs
            .filter(e => e.type !== 'other') // Filter out untyped refs if desired
            .map(e => ({ id: e.id, name: e.name })),

        // Has AI interpretation awaiting decision
        hasPendingInterpretation:
            thread.aiInterpretations?.some(i => i.status === 'pending') ?? false,

        // Has clock with segments remaining
        hasActiveClock:
            !!thread.clock && thread.clock.filled < thread.clock.segments,

        // Has track with segments remaining
        hasActiveTrack:
            !!thread.track && thread.track.filled < thread.track.segments,

        // Already committed
        isCanon: thread.intent === 'canon',
    };
}
