import React from 'react';
import { Sparkles, Table, Dices, User, Cpu, Clock, TrendingUp } from 'lucide-react';
import { Thread } from '../../types/thread';
import { resolveThreadColor } from '../../constants/theme';

interface ThreadHeaderProps {
    thread: Thread;
    isExpanded: boolean;
    onToggle: () => void;
}

export function ThreadHeader({ thread, isExpanded, onToggle }: ThreadHeaderProps) {
    // Use shared resolver for consistency
    const headerBgColor = resolveThreadColor(thread.source, thread.type);

    // Generate timestamp
    const timestamp = thread.timestamp
        ? new Date(thread.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    // Resolve Icon
    let Icon = Dices;
    if (thread.source === 'weave') Icon = Table;
    if (thread.source === 'ai') Icon = Sparkles;
    if (thread.source === 'user') Icon = User;
    if (thread.source === 'clock') Icon = Clock;
    if (thread.source === 'track') Icon = TrendingUp;
    if (thread.source === 'system') Icon = Cpu;

    return (
        <button
            onClick={onToggle}
            className="w-full px-3 py-1 border-b border-slate-700 text-left transition-opacity hover:opacity-90 focus:outline-none flex justify-between items-center"
            style={{ backgroundColor: headerBgColor }}
        >
            <span className="text-sm font-bold flex items-center gap-2" style={{ color: '#eeffff' }}>
                <Icon className="w-3 h-3" />
                {thread.header}
            </span>
            <span
                className="text-xs"
                style={{ color: '#eeffff', opacity: 0.7 }}
            >
                {timestamp}
            </span>
        </button>
    );
}
