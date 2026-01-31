// ─────────────────────────────────────────────────────────────────────────────
// Session Header
// 
// Displays session title, status, and control buttons.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import { useActiveSession, useSessionStore } from '../../stores/useSessionStore';
import { Settings, Download, X, Check, FileText, Maximize2, Minimize2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────

const noDrag: React.CSSProperties = {
    WebkitAppRegion: 'no-drag'
} as any;

interface SessionHeaderProps {
    onExport?: () => void;
    onCurate?: () => void;
    onSettings?: () => void;
    onToggleWidth?: () => void;
    isFullWidth?: boolean;
    onClose?: () => void;
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const SessionHeader: React.FC<SessionHeaderProps> = ({
    onExport,
    onCurate,
    onSettings,
    onToggleWidth,
    isFullWidth,
    onClose,
    className = '',
}) => {
    const session = useActiveSession();
    const { renameSession } = useSessionStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    // ─────────────────────────────────────────────────────────────────────────
    // Title Editing
    // ─────────────────────────────────────────────────────────────────────────

    const startEditing = useCallback(() => {
        if (!session) return;
        setEditTitle(session.title);
        setIsEditing(true);
    }, [session]);

    const saveTitle = useCallback(() => {
        if (!session || !editTitle.trim()) return;
        // Call renameSession to handle file renaming and tree/tab updates
        renameSession(editTitle.trim());
        setIsEditing(false);
    }, [session, editTitle, renameSession]);

    const cancelEditing = useCallback(() => {
        setIsEditing(false);
        setEditTitle('');
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // No Session State
    // ─────────────────────────────────────────────────────────────────────────

    if (!session) {
        return (
            <div className={`flex items-center justify-between p-4 border-b border-slate-700 ${className}`}>
                <span className="text-slate-500">No active session</span>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className={`flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 ${className}`}>
            {/* Left: Title */}
            <div className="flex items-center gap-3">
                <span className="text-xl">📜</span>

                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveTitle();
                                if (e.key === 'Escape') cancelEditing();
                            }}
                            autoFocus
                            className="
                px-2 py-1 bg-slate-900 border border-slate-600 rounded
                text-lg font-semibold text-slate-100
                focus:outline-none focus:border-violet-500
              "
                            style={noDrag}
                        />
                        <button
                            onClick={saveTitle}
                            className="p-1 text-green-500 hover:text-green-400"
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={cancelEditing}
                            className="p-1 text-red-500 hover:text-red-400"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <h1
                        onClick={startEditing}
                        className="text-lg font-semibold text-slate-100 cursor-pointer hover:text-violet-400 transition-colors relative z-10"
                        title="Click to edit title"
                        style={noDrag}
                    >
                        {session.title}
                    </h1>
                )}

                {/* Card Count Badge */}
                <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded-full">
                    {session.cards.length} cards
                </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {onCurate && (
                    <button
                        onClick={onCurate}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors"
                        title="Curate to Markdown"
                    >
                        <FileText size={14} />
                        <span>Curate</span>
                    </button>
                )}

                {onToggleWidth && (
                    <button
                        onClick={onToggleWidth}
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                        title={isFullWidth ? "Switch to Readable Width" : "Switch to Full Width"}
                    >
                        {isFullWidth ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                )}

                {onExport && (
                    <button
                        onClick={onExport}
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                        title="Export Session"
                    >
                        <Download size={18} />
                    </button>
                )}

                {onSettings && (
                    <button
                        onClick={onSettings}
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                        title="Session Settings"
                    >
                        <Settings size={18} />
                    </button>
                )}

                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                        title="Close Session"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SessionHeader;
