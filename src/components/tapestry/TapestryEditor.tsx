import { useEffect, useState } from 'react';
import { SessionPanel } from '../session/SessionPanel';
import { SessionHeader } from '../session/SessionHeader';
import { useSessionStore } from '../../stores/useSessionStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { MilkdownEditor } from './MilkdownEditor';
import { MarkdownViewer } from './MarkdownViewer';
import { EditorModeToggle } from './EditorModeToggle';
import { TagList } from '../tags/TagList';

export function TapestryEditor() {
    const { mode, openEntries, activeEntryId, updateEntryContent, saveEntry, addTag, removeTag } = useEditorStore();
    const { setTagFilter } = useTapestryStore();
    const [isFullWidth, setIsFullWidth] = useState(false);

    const activeEntry = openEntries.find(e => e.id === activeEntryId);

    // Ctrl+S shortcut for saving
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                // Don't trigger editor save for session files (they auto-save via SessionStore)
                if (activeEntryId && activeEntry && !activeEntry.path.endsWith('.json')) {
                    saveEntry(activeEntryId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeEntryId, activeEntry, saveEntry]);

    // Session Routing Logic
    const isSessionFile = activeEntry?.path.endsWith('.json');

    useEffect(() => {
        if (isSessionFile && activeEntry) {
            try {
                // Parse the raw JSON content
                const sessionData = JSON.parse(activeEntry.content);

                // Update store if switched to a new session file
                // Update store if switched to a new session file
                const { activeSessionId, activeFilePath, importSession, setActiveSession, setActiveSessionFilePath, sessions } = useSessionStore.getState();

                // Normalize paths for comparison (handle Windows drive letter case differences)
                const currentPath = activeFilePath?.toLowerCase() || '';
                const newPath = activeEntry.path.toLowerCase();

                // Check if we need to switch/import
                if (currentPath !== newPath || activeSessionId !== sessionData.id) {
                    // Safety check: Don't overwrite if in-memory session is newer
                    const existingSession = sessions.find(s => s.id === sessionData.id);
                    if (existingSession) {
                        const inMemoryTime = new Date(existingSession.updatedAt).getTime();
                        const fileTime = new Date(sessionData.updatedAt).getTime();

                        if (inMemoryTime > fileTime) {
                            console.warn('[TapestryEditor] Skipping import - in-memory session is newer.', { inMemory: existingSession.updatedAt, file: sessionData.updatedAt });
                            // However, we MUST set the active session ID and path if they differ, so the UI switches context
                            if (activeSessionId !== sessionData.id) setActiveSession(sessionData.id);
                            if (currentPath !== newPath) setActiveSessionFilePath(activeEntry.path);
                            return;
                        }
                    }

                    importSession(sessionData);
                    setActiveSession(sessionData.id);
                    setActiveSessionFilePath(activeEntry.path);
                    console.log('Loaded session from file:', activeEntry.path);
                }
            } catch (error) {
                console.error('Failed to parse session file:', error);
            }
        }
    }, [activeEntry?.path, activeEntry?.content, isSessionFile]);


    if (!activeEntry) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-900">
                <div className="text-slate-400">No panel selected. Open a panel from the Tapestry tree.</div>
            </div>
        );
    }

    // Render Session Panel for JSON files
    if (isSessionFile) {
        return (
            <div className="flex flex-col bg-slate-900" style={{ height: '100%' }}>
                {/* Reuse Editor Header or use SessionHeader? 
                    SessionHeader was removed from SessionPanel.
                    Let's reuse the standard header for now, or maybe hide it?
                    The plan didn't specify. Standard header has tags.
                */}
                <SessionHeader
                    className="border-b border-slate-800 bg-slate-900/50"
                    isFullWidth={isFullWidth}
                    onToggleWidth={() => setIsFullWidth(!isFullWidth)}
                />

                <div className="flex-1 overflow-hidden">
                    <SessionPanel
                        className="h-full"
                        isFullWidth={isFullWidth}
                    />
                </div>
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
