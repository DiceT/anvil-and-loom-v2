// ─────────────────────────────────────────────────────────────────────────────
// Session Timeline
// 
// Renders the scrollable list of Thread Cards in a Live Session.
// Handles auto-scroll, virtualization (if needed), and drag-to-reorder.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { ThreadCard } from './ThreadCard';
import { useActiveCards } from '../../stores/useSessionStore';
import type { ThreadCard as ThreadCardType } from '../../types/threadCard';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SessionTimelineProps {
    onAction?: (action: string, params?: Record<string, unknown>) => void;
    onTagClick?: (tag: string) => void;
    autoScroll?: boolean;
    showTimestamps?: boolean;
    isFullWidth?: boolean;
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
    onAction,
    onTagClick,
    autoScroll = true,
    showTimestamps = true,
    isFullWidth = false,
    className = '',
}) => {
    const cards = useActiveCards();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const lastCardCountRef = useRef(cards.length);

    // ─────────────────────────────────────────────────────────────────────────
    // Auto-scroll when new cards are added
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!autoScroll) return;

        // Only scroll if cards were added (not removed or reordered)
        if (cards.length > lastCardCountRef.current) {
            const container = scrollContainerRef.current;
            if (container) {
                // Smooth scroll to bottom
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth',
                });
            }
        }

        lastCardCountRef.current = cards.length;
    }, [cards.length, autoScroll]);

    // ─────────────────────────────────────────────────────────────────────────
    // Empty State
    // ─────────────────────────────────────────────────────────────────────────

    if (cards.length === 0) {
        return (
            <div className={`flex-1 flex items-center justify-center ${className}`}>
                <div className="text-center text-slate-500">
                    <div className="text-4xl mb-2">🎲</div>
                    <div className="text-sm">No cards yet.</div>
                    <div className="text-xs mt-1">
                        Roll some dice, consult an oracle, or add a note to get started.
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div
            ref={scrollContainerRef}
            className={`
        flex-1 overflow-y-auto
        flex-1 overflow-y-auto
        p-4
        ${className}
      `}
        >
            <div className={`
                ${isFullWidth ? '' : 'max-w-3xl mx-auto'}
                space-y-3
            `}>
                {cards.map((card) => (
                    <ThreadCard
                        key={card.id}
                        card={card}
                        onAction={onAction}
                        onTagClick={onTagClick}
                        showTimestamp={showTimestamps}
                        showActions={true}
                    />
                ))}
            </div>

            {/* Scroll anchor */}
            <div id="timeline-bottom" />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Timeline with Date Separators (Optional Enhancement)
// ─────────────────────────────────────────────────────────────────────────────

interface GroupedCard {
    type: 'card';
    card: ThreadCardType;
}

interface DateSeparator {
    type: 'separator';
    date: string;
}

type TimelineItem = GroupedCard | DateSeparator;

function groupCardsByDate(cards: ThreadCardType[]): TimelineItem[] {
    const items: TimelineItem[] = [];
    let lastDate: string | null = null;

    for (const card of cards) {
        const cardDate = new Date(card.timestamp).toLocaleDateString();

        if (cardDate !== lastDate) {
            items.push({ type: 'separator', date: cardDate });
            lastDate = cardDate;
        }

        items.push({ type: 'card', card });
    }

    return items;
}

export const SessionTimelineGrouped: React.FC<SessionTimelineProps> = ({
    onAction,
    onTagClick,
    autoScroll = true,
    showTimestamps = true,
    className = '',
}) => {
    const cards = useActiveCards();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const items = groupCardsByDate(cards);

    useEffect(() => {
        if (!autoScroll || cards.length === 0) return;

        const container = scrollContainerRef.current;
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [cards.length, autoScroll]);

    if (cards.length === 0) {
        return (
            <div className={`flex-1 flex items-center justify-center ${className}`}>
                <div className="text-center text-slate-500">
                    <div className="text-4xl mb-2">🎲</div>
                    <div className="text-sm">No cards yet.</div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={scrollContainerRef}
            className={`flex-1 overflow-y-auto p-4 space-y-3 ${className}`}
        >
            {items.map((item) => {
                if (item.type === 'separator') {
                    return (
                        <div
                            key={`sep-${item.date}`}
                            className="flex items-center gap-3 py-2"
                        >
                            <div className="flex-1 h-px bg-slate-700" />
                            <span className="text-xs text-slate-500 font-medium">
                                {item.date}
                            </span>
                            <div className="flex-1 h-px bg-slate-700" />
                        </div>
                    );
                }

                return (
                    <ThreadCard
                        key={item.card.id}
                        card={item.card}
                        onAction={onAction}
                        onTagClick={onTagClick}
                        showTimestamp={showTimestamps}
                        showActions={true}
                    />
                );
            })}
        </div>
    );
};

export default SessionTimeline;
