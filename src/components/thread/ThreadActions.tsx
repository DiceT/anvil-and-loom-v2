import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Thread } from '../../types/thread';
import { ThreadAction } from '../../lib/thread/actions/types';

interface ThreadActionsProps {
    thread: Thread;
    actions: ThreadAction[];
    onAction: (action: ThreadAction) => Promise<void> | void;
}

export function ThreadActions({ thread, actions, onAction }: ThreadActionsProps) {
    const [executingId, setExecutingId] = useState<string | null>(null);

    if (!actions || actions.length === 0) return null;

    const handleAction = async (action: ThreadAction) => {
        if (executingId) return; // Prevent multiple actions

        try {
            setExecutingId(action.id);
            await onAction(action);
        } catch (error) {
            console.error('Action execution failed:', error);
        } finally {
            setExecutingId(null);
        }
    };

    return (
        <div className="px-2 py-1.5 border-t border-slate-700 bg-slate-900/50 flex flex-wrap gap-1">
            {actions.map(action => {
                const isExecuting = executingId === action.id;
                const Icon = isExecuting ? Loader2 : action.icon;

                return (
                    <button
                        key={action.id}
                        onClick={() => handleAction(action)}
                        title={action.description}
                        disabled={!!executingId}
                        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${executingId
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                            } ${isExecuting ? 'text-blue-400' : ''}`}
                    >
                        <Icon className={`w-3 h-3 ${isExecuting ? 'animate-spin' : ''}`} />
                        <span>{action.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
