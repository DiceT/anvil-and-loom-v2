import { Edit3, Eye, Save, Sparkles } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useAiStore } from '../../stores/useAiStore';
import { useThreadInterpretation } from '../../hooks/useThreadInterpretation';
import { useState } from 'react';

export function EditorModeToggle() {
    const { mode, setMode, saveAllEntries, openEntries, activeEntryId, saveEntry } = useEditorStore();
    const { isConfigured } = useAiStore();
    const { interpretFirstLook } = useThreadInterpretation();
    const [isInterpreting, setIsInterpreting] = useState(false);

    const activeEntry = openEntries.find(e => e.id === activeEntryId);
    const isDirty = activeEntry?.isDirty || false;
    const isPlacePanel = activeEntry?.category === 'place';
    const showAiButton = isPlacePanel && isConfigured() && mode === 'view';

    const handleModeToggle = async () => {
        if (mode === 'edit') {
            // Auto-save before switching to view
            await saveAllEntries();
        }
        setMode(mode === 'view' ? 'edit' : 'view');
    };

    const handleSave = async () => {
        if (activeEntryId) {
            await saveEntry(activeEntryId);
        }
    };

    const handleInterpretAll = async () => {
        if (!activeEntry) return;

        setIsInterpreting(true);
        try {
            // Find all First Look threads in the content
            const content = activeEntry.content || '';
            const regex = /```result-card\n([\s\S]*?)\n```/g;
            let match;
            let interpretCount = 0;

            while ((match = regex.exec(content)) !== null) {
                try {
                    const thread = JSON.parse(match[1]);
                    // Only interpret if it's a First Look thread and doesn't already have interpretations
                    if (thread.source?.startsWith('First Look') && (!thread.aiInterpretations || thread.aiInterpretations.length === 0)) {
                        await interpretFirstLook(thread, activeEntry);
                        interpretCount++;
                    }
                } catch (e) {
                    // Skip invalid JSON
                    continue;
                }
            }

            if (interpretCount === 0) {
                console.log('No uninterpreted First Look threads found');
            }
        } catch (error) {
            console.error('Interpretation failed:', error);
        } finally {
            setIsInterpreting(false);
        }
    };

    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
            {/* Mode Toggle */}
            <button
                onClick={handleModeToggle}
                className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title={mode === 'view' ? 'Switch to Edit mode' : 'Switch to View mode'}
            >
                {mode === 'view' ? (
                    <Edit3 className="w-5 h-5" />
                ) : (
                    <Eye className="w-5 h-5" />
                )}
            </button>

            {/* Save Button (only in edit mode) */}
            {mode === 'edit' && (
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

            {/* Interpret AI Button (only for Place panels in view mode) */}
            {showAiButton && (
                <button
                    onClick={handleInterpretAll}
                    disabled={isInterpreting}
                    className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Interpret uninterpreted First Look threads with AI"
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">{isInterpreting ? 'Interpreting...' : 'Interpret AI'}</span>
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
