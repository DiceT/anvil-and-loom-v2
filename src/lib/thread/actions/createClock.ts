import { Clock } from 'lucide-react';
import { ThreadAction } from './types';
import { ThreadClock, createThread } from '../../../types/thread';

export const createClockAction: ThreadAction = {
    id: 'create-clock',
    label: 'Create Clock',
    icon: Clock,
    shortcut: 'C',
    description: 'Defer this result to a timed clock',

    isAvailable: (thread, analysis) => {
        return analysis.canCreateClock;
    },

    isEnabled: () => true,

    requiresConfirmation: true,
    confirmationMessage: 'Create a clock for this result?',

    execute: async (thread, context) => {
        // In a real implementation, this would open a dialog.
        // For now, we create a default clock.

        const clock: ThreadClock = {
            id: `clock_${Date.now()}`,
            name: thread.summary.slice(0, 50),
            segments: 4,
            filled: 0,
            trigger: 'sessions',
        };

        // Update original thread with clock or create new?
        // The roadmap says "Create new Thread recording the clock creation"
        const clockThread = createThread({
            type: 'system',
            source: 'clock',
            header: 'Clock Created',
            summary: `Clock "${clock.name}" (0/${clock.segments})`,
        });

        clockThread.intent = 'meta';
        clockThread.content = `Deferred from: ${thread.summary}`;
        clockThread.clock = clock;
        clockThread.parentThreadId = thread.id;
        clockThread.createdBy = 'user';

        return [clockThread];
    },
};
