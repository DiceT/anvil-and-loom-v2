import { useEffect } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { MilkdownEditor } from './MilkdownEditor';
import { MarkdownViewer } from './MarkdownViewer';
import { EditorModeToggle } from './EditorModeToggle';

export function TapestryEditor() {
    const { mode, openEntries, activeEntryId, updateEntryContent, saveEntry } = useEditorStore();

    const activeEntry = openEntries.find(e => e.id === activeEntryId);

    // Ctrl+S shortcut for saving
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (activeEntryId) {
                    saveEntry(activeEntryId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeEntryId, saveEntry]);

    if (!activeEntry) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-900">
                <div className="text-slate-400">No panel selected. Open a panel from the Tapestry tree.</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-slate-900" style={{ height: '100%' }}>
            {/* Mode Toggle Bar */}
            <EditorModeToggle />

            {/* Editor Content - scroll container with explicit height */}
            <div className="flex-1 app-scroll" style={{ overflow: 'auto' }}>
                {mode === 'edit' ? (
                    <MilkdownEditor
                        markdown={activeEntry.content}
                        onMarkdownChange={(content) => updateEntryContent(activeEntry.id, content)}
                    />
                ) : (
                    <MarkdownViewer markdown={activeEntry.content} />
                )}
            </div>
        </div>
    );
}
