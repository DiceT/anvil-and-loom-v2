import { ThreadAction, ActionContext } from './types';
import { Thread } from '../../../types/thread';
import { ThreadAnalysis } from '../threadAnalyzer';

// Import all actions
import { interpretAction } from './interpret';
import { createClockAction } from './createClock';
import { createTrackAction } from './createTrack';

/** All registered actions */
const ACTIONS: ThreadAction[] = [
    // Interpret category
    interpretAction,

    // Defer category
    createClockAction,
    createTrackAction,

    // Add more as implemented
];

/** Get all actions available for a thread */
export function getAvailableActions(
    thread: Thread,
    analysis: ThreadAnalysis,
    context: ActionContext
): ThreadAction[] {
    return ACTIONS.filter(action =>
        action.isAvailable(thread, analysis, context)
    );
}

/** Get a specific action by ID */
export function getAction(id: string): ThreadAction | undefined {
    return ACTIONS.find(action => action.id === id);
}

/** Register a custom action (for plugins/extensions) */
export function registerAction(action: ThreadAction): void {
    ACTIONS.push(action);
}
