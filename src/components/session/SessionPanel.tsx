// ─────────────────────────────────────────────────────────────────────────────
// Session Panel (Main Window)
// 
// Renders the Thread Card timeline for a Live Session.
// This is the PRIMARY view when a session file is open.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { SessionTimeline } from './SessionTimeline';
import { useActiveSession, useSessionStore } from '../../stores/useSessionStore';
import { useSessionActions } from '../../hooks/useSessionActions';

interface SessionPanelProps {
    isFullWidth?: boolean;
    className?: string;
}

export const SessionPanel: React.FC<SessionPanelProps> = ({
    isFullWidth = false,
    className = '',
}) => {
    const session = useActiveSession();
    const { createSession } = useSessionStore();
    const { dispatch } = useSessionActions();

    // ─────────────────────────────────────────────────────────────────────────
    // Action Handler (from Thread Cards)
    // ─────────────────────────────────────────────────────────────────────────

    const handleAction = React.useCallback((action: string, params?: Record<string, unknown>) => {
        console.log('[SessionPanel] Action:', action, params);
        dispatch(action, params || {});
    }, [dispatch]);

    // ─────────────────────────────────────────────────────────────────────────
    // Empty State
    // ─────────────────────────────────────────────────────────────────────────

    if (!session) {
        return (
            <div className={`flex flex-col h-full bg-slate-900 ${className} items-center justify-center`}>
                <div className="text-center">
                    <div className="text-6xl mb-4">🎭</div>
                    <h2 className="text-xl font-semibold text-slate-200 mb-2">
                        No Active Session
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Start a new session to begin your adventure.
                    </p>
                    <button
                        onClick={() => createSession('New Session')}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                    >
                        Start New Session
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Timeline */}
            <SessionTimeline
                onAction={handleAction}
                showTimestamps={true}
                autoScroll={true}
                isFullWidth={isFullWidth}
                className="flex-1"
            />
        </div>
    );
};

export default SessionPanel;
