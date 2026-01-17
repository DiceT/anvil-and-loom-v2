import { useEffect } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { MilkdownEditor } from './MilkdownEditor';
import { MarkdownViewer } from './MarkdownViewer';
import { EditorModeToggle } from './EditorModeToggle';
import { TagList } from '../tags/TagList';

export function TapestryEditor() {
    const { mode, openEntries, activeEntryId, updateEntryContent, saveEntry, addTag, removeTag } = useEditorStore();
    const { setTagFilter } = useTapestryStore();

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

            {/* Panel Header with Tags */}
            <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50">
                <h1 className="text-xl font-semibold text-white mb-2">{activeEntry.title}</h1>
                <TagList
                    tags={activeEntry.frontmatter.tags || []}
                    onAdd={mode === 'edit' ? (tag) => addTag(activeEntry.id, tag) : undefined}
                    onRemove={mode === 'edit' ? (tag) => removeTag(activeEntry.id, tag) : undefined}
                    onTagClick={(tag) => setTagFilter(tag)}
                    editable={mode === 'edit'}
                />
            </div>

            {/* Editor Content - scroll container with explicit height */}
            <div className="flex-1 app-scroll" style={{ overflow: 'auto' }}>
                {mode === 'edit' || mode === 'source' ? (
                    <MilkdownEditor
                        key={activeEntry.id}
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
