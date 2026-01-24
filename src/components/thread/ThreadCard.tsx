import React, { useState } from 'react';
import { Thread } from '../../types/thread';
import { ThreadHeader } from './ThreadHeader';
import { ThreadSummary } from './ThreadSummary';
import { ThreadContent } from './ThreadContent';
import { ThreadClock } from './ThreadClock';
import { ThreadActions } from './ThreadActions';
import { ThreadAction, ActionContext } from '../../lib/thread/actions/types';
import { ThreadAnalysis } from '../../lib/thread/threadAnalyzer';

interface ThreadCardProps {
    thread: Thread;
    mode?: 'embedded' | 'history' | 'compact' | 'full';
    defaultExpanded?: boolean;
    actions?: ThreadAction[];
    onAction?: (action: ThreadAction, thread: Thread) => void;
    onUpdate?: (updates: any) => void;
}

export function ThreadCard({
    thread,
    mode = 'history',
    defaultExpanded = false,
    actions = [],
    onAction,
    onUpdate
}: ThreadCardProps) {
    if (thread.clock || thread.track) {
        console.log('[ThreadCard] Render', { id: thread.id, hasOnUpdate: !!onUpdate });
    }
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const handleAction = (action: ThreadAction) => {
        if (onAction) {
            onAction(action, thread);
        }
    };

    return (
        <div className="bg-canvas-panel border border-border rounded-lg overflow-hidden flex flex-col my-2 shadow-sm hover:border-border-active transition-colors">
            <ThreadHeader
                thread={thread}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            <ThreadContent thread={thread} isExpanded={isExpanded} />

            <ThreadSummary thread={thread} />

            <ThreadClock thread={thread} onUpdate={onUpdate} />

            {mode !== 'compact' && actions.length > 0 && (
                <ThreadActions thread={thread} actions={actions} onAction={handleAction} />
            )}
        </div>
    );
}
