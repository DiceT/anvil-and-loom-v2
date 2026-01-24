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

    // Contrast color for text on top of gem colors
    // Almost all gem colors are light/bright, so dark text is appropriate.
    // Using --bg-app (Deep Charcoal) for max contrast.
    const contrastColor = 'var(--bg-app)';

    return (
        <button
            onClick={onToggle}
            className="w-full border-b border-border text-left transition-opacity hover:opacity-90 focus:outline-none flex justify-between items-center group"
            style={{
                backgroundColor: headerBgColor,
                color: contrastColor,
                padding: '5px 12px' // Explicit override to ensure 5px height
            }}
        >
            <span className="text-sm font-bold leading-none flex items-center gap-2">
                <Icon className="w-4 h-4 opacity-75 group-hover:opacity-100" />
                <span style={{ color: contrastColor }}>{thread.header}</span>
            </span>
            <span
                className="text-xs opacity-60 group-hover:opacity-80"
                style={{ color: contrastColor }}
            >
                {timestamp}
            </span>
        </button>
    );
}
