import React from 'react';
import { Thread } from '../../types/thread';
import { ThreadAction } from '../../lib/thread/actions/types';

interface ThreadActionsProps {
    thread: Thread;
    actions: ThreadAction[];
    onAction: (action: ThreadAction) => void;
}

export function ThreadActions({ thread, actions, onAction }: ThreadActionsProps) {
    if (!actions || actions.length === 0) return null;

    return (
        <div className="px-2 py-1.5 border-t border-slate-700 bg-slate-900/50 flex flex-wrap gap-1">
            {actions.map(action => (
                <button
                    key={action.id}
                    onClick={() => onAction(action)}
                    title={action.description}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                >
                    <action.icon className="w-3 h-3" />
                    <span>{action.label}</span>
                </button>
            ))}
        </div>
    );
}
