import { Edit3, Eye, Save } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';

export function EditorModeToggle() {
    const { mode, setMode, saveAllEntries, openEntries, activeEntryId, saveEntry } = useEditorStore();

    const activeEntry = openEntries.find(e => e.id === activeEntryId);
    const isDirty = activeEntry?.isDirty || false;

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

            {/* Dirty Indicator */}
            {isDirty && (
                <span className="text-xs text-slate-400">
                    • Unsaved changes
                </span>
            )}
        </div>
    );
}
