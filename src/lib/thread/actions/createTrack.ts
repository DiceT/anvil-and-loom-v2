import { TrendingUp } from 'lucide-react';
import { ThreadAction } from './types';
import { ThreadTrack, createThread } from '../../../types/thread';

export const createTrackAction: ThreadAction = {
    id: 'create-track',
    label: 'Create Track',
    icon: TrendingUp,
    shortcut: 'T',
    description: 'Create a progress track for this result',

    isAvailable: (thread, analysis) => {
        return analysis.canCreateTrack;
    },

    isEnabled: () => true,

    execute: async (thread, context) => {
        const track: ThreadTrack = {
            id: `track_${Date.now()}`,
            name: thread.summary.slice(0, 50),
            segments: 6,
            filled: 0,
            difficulty: 'standard',
        };

        const trackThread = createThread({
            type: 'system',
            source: 'track',
            header: 'Progress Track Created',
            summary: `Track "${track.name}" (0/${track.segments})`,
        });

        trackThread.intent = 'meta';
        trackThread.content = `Based on: ${thread.summary}`;
        trackThread.track = track;
        trackThread.parentThreadId = thread.id;
        trackThread.createdBy = 'user';

        return [trackThread];
    },
};
