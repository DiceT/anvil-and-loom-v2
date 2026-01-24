import React from 'react';
import { Thread } from '../../types/thread';

interface ThreadSummaryProps {
    thread: Thread;
}

export function ThreadSummary({ thread }: ThreadSummaryProps) {
    // If a clock or track is present, the visual component takes precedence
    // and the summary text (which is usually just a backup description) is redundant.
    if (thread.clock || thread.track) return null;

    return (
        <div className="px-3 py-1.5 border-t border-slate-700 bg-slate-800/50">
            <div className="text-slate-100 text-sm whitespace-pre-wrap leading-relaxed">
                {thread.summary}
            </div>
        </div>
    );
}
