import { Edit3, Eye, Save, Code } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useState } from 'react';
import { EditorMode } from '../../types/tapestry';
import { useSessionStore } from '../../stores/useSessionStore';
import { Lock } from 'lucide-react';

export function EditorModeToggle() {
    const { mode, setMode, saveAllEntries, openEntries, activeEntryId, saveEntry } = useEditorStore();
    const activeEntry = openEntries.find(e => e.id === activeEntryId);
    const isDirty = activeEntry?.isDirty || false;

    const { activeSessionId } = useSessionStore();
    // Start of Selection
    const isSessionPanel = activeEntryId === activeSessionId;
    const isReadOnly = isSessionPanel; // Could extend logic later

    const handleModeToggle = async (newMode: EditorMode) => {
        if (mode === 'edit' || mode === 'source') {
            // Auto-save before switching modes
            await saveAllEntries();
        }
        setMode(newMode);
    };

    const handleSave = async () => {
        if (activeEntryId) {
            await saveEntry(activeEntryId);
        }
    };

    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
            {/* Mode Toggle */}
            {/* Read Only Indicator */}
            {isReadOnly && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-900/20 border border-red-900/50 rounded mr-2">
                    <Lock className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400 font-medium tracking-wide">SESSION LOCK</span>
                </div>
            )}

            {/* Mode Toggle */}
            <div className={`flex bg-slate-800 rounded p-0.5 ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                    onClick={() => handleModeToggle('view')}
                    className={`p-1.5 rounded transition-colors ${mode === 'view' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="View Mode"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    disabled={isReadOnly}
                    onClick={() => handleModeToggle('edit')}
                    className={`p-1.5 rounded transition-colors ${mode === 'edit' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                    title={isReadOnly ? "Session logs are read-only while active" : "Edit Mode"}
                >
                    <Edit3 className="w-4 h-4" />
                </button>
                <button
                    disabled={isReadOnly}
                    onClick={() => handleModeToggle('source')}
                    className={`p-1.5 rounded transition-colors ${mode === 'source' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                    title={isReadOnly ? "Session logs are read-only while active" : "Source Mode (Raw JSON)"}
                >
                    <Code className="w-4 h-4" />
                </button>
            </div>


            {/* Save Button (only in edit mode) */}
            {!isReadOnly && mode === 'edit' && (
                <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${isDirty
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                    title="Save entry (Ctrl+S)"
                >
                    <Save className="w-4 h-4" />
                    <span className="text-sm">Save</span>
                </button>
            )}

            {/* Dirty Indicator */}
            {isDirty && (
                <span className="text-xs text-slate-400">
                    • Unsaved changes
                </span>
            )}
        </div>
    );
}
