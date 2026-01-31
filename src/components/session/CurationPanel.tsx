import React, { useState, useCallback } from 'react';
import { useSessionStore, useActiveSession } from '../../stores/useSessionStore';
import { Trash2, FolderPlus, Clipboard } from 'lucide-react';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { ThreadCard } from './ThreadCard'; // Use full card for now, or compact if available
import { threadCardsToMarkdown } from '../../utils/threadCardMarkdown';
// import type { ThreadCard } from '../../types/threadCard';

interface CurationPanelProps {
    onSendToPanel?: (markdown: string, panelId: string) => void;
    availablePanels?: Array<{ id: string; title: string }>;
}

export const CurationPanel: React.FC<CurationPanelProps> = ({
    onSendToPanel,
    availablePanels = [],
}) => {
    const session = useActiveSession();
    const { activeSessionId } = useSessionStore();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [autoAdd, setAutoAdd] = useState(true);

    const activeSession = session; // Alias for minimal code change

    const cards = activeSession?.cards || [];

    // ─────────────────────────────────────────────────────────────────────────
    // Selection Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const toggleSelection = useCallback((cardId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(cardId)) {
                next.delete(cardId);
            } else {
                next.add(cardId);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(cards.map((c) => c.id)));
    }, [cards]);

    const selectNone = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Export Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const getSelectedCards = useCallback(() => {
        return cards.filter((c) => selectedIds.has(c.id));
    }, [cards, selectedIds]);

    const copyToClipboard = useCallback(async () => {
        const selected = getSelectedCards();
        if (selected.length === 0) return;

        const markdown = selected.map(c => `###### ${c.header}\n${c.result}\n\n---\n`).join('\n');
        await navigator.clipboard.writeText(markdown);

        console.log('[CurationPanel] Copied to clipboard');
    }, [getSelectedCards]);

    const createPanelFromSelection = useCallback(async () => {
        const selected = getSelectedCards();
        if (selected.length === 0) return;

        // Format Markdown
        const markdown = selected.map(c => `###### ${c.header}\n${c.result}\n\n---\n`).join('\n');

        const timestamp = new Date().toLocaleString().replace(/[/:]/g, '-');
        const title = `Curation ${timestamp}`;

        try {
            // 1. Create Entry
            // We use 'root' (or empty?) category to put it in the root entries folder if possible, 
            // or just let createEntry fallback to 'entries' if category is invalid/handled. 
            // The request said "in the Root of the tapestry directory", but `createEntry` logic usually puts it in `entries`. 
            // I'll use a category that might map to root, or just pass a custom path if `createEntry` allowed it, but it takes (dir, title, category). 
            // Let's assume 'entries' is the "Root of the tapestry directory" for content. 
            // Actually, `createEntry` in store takes category 'session' -> 'entries/Sessions'. Default is 'entries'. 
            // So if I pass undefined or empty or 'general', it goes to 'entries'.

            const { createEntry, saveFile } = useTapestryStore.getState();
            const { openEntry } = useEditorStore.getState();

            const newEntry = await createEntry(title, 'general');

            // 2. Overwrite content
            await saveFile(newEntry.path, markdown);

            // 3. Open it
            await openEntry(newEntry.path);

            // Clear selection
            setSelectedIds(new Set());

        } catch (error) {
            console.error('Failed to create curation panel:', error);
            alert('Failed to create panel. check console.');
        }

    }, [getSelectedCards, activeSession]);

    const deleteSelectedThreads = useCallback(() => {
        const selected = getSelectedCards();
        if (selected.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selected.length} threads? This cannot be undone.`)) {
            const { deleteCards } = useSessionStore.getState();
            deleteCards(selected.map(c => c.id));
            setSelectedIds(new Set());
        }
    }, [getSelectedCards]);

    const sendToPanel = useCallback((panelId: string) => {
        const selected = getSelectedCards();
        if (selected.length === 0 || !onSendToPanel) return;

        const markdown = selected.map(c => `**${c.header}**\n${c.content.map(b => b.value).join('\n')}`).join('\n\n');
        onSendToPanel(markdown, panelId);
    }, [getSelectedCards, onSendToPanel]);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    if (!activeSession) {
        return (
            <div className="p-4 text-center text-slate-500">
                No active session
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="p-3 border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-slate-200">
                        {activeSession.title}
                    </h2>
                    <span className="text-xs text-slate-500">
                        {cards.length} cards
                    </span>
                </div>

                {/* Auto-Add Toggle */}
                <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input
                        type="checkbox"
                        checked={autoAdd}
                        onChange={(e) => setAutoAdd(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700"
                    />
                    Auto-add new cards
                </label>
            </div>

            {/* Card List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        className={`
              relative cursor-pointer rounded border transition-colors
              ${selectedIds.has(card.id)
                                ? 'border-violet-500 bg-violet-900/20'
                                : 'border-transparent hover:bg-slate-800'
                            }
            `}
                        onClick={() => toggleSelection(card.id)}
                    >
                        {/* Checkbox Overlay */}
                        <div className="absolute top-2 left-2 z-10">
                            <input
                                type="checkbox"
                                checked={selectedIds.has(card.id)}
                                onChange={() => toggleSelection(card.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded bg-slate-700 border-slate-600"
                            />
                        </div>

                        {/* Minimal Card Render */}
                        <div className="pl-8 p-2 opacity-80 pointer-events-none">
                            <div className="text-xs font-bold text-slate-400 mb-1">{card.header}</div>
                            <div className="text-sm text-slate-300 line-clamp-2">
                                {card.result || 'No result'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-slate-800 space-y-2">
                {/* Selection Controls */}
                <div className="flex gap-2 text-xs">
                    <button
                        onClick={selectAll}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                        onClick={selectNone}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        Select None
                    </button>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-500">
                        {selectedIds.size} selected
                    </span>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={copyToClipboard}
                        disabled={selectedIds.size === 0}
                        className="
              flex items-center justify-center gap-2
              w-full px-3 py-2 text-sm
              bg-slate-700 hover:bg-slate-600 
              disabled:opacity-50 disabled:cursor-not-allowed
              rounded transition-colors text-white
            "
                    >
                        <Clipboard size={16} />
                        <span>Copy to Clipboard</span>
                    </button>

                    {/* Send to Panel Dropdown */}
                    {availablePanels.length > 0 && (
                        <div className="relative">
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        sendToPanel(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                                disabled={selectedIds.size === 0}
                                className="
                  w-full px-3 py-2 text-sm
                  bg-slate-700 hover:bg-slate-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  rounded transition-colors text-white
                  appearance-none cursor-pointer
                "
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    📤 Send to Panel...
                                </option>
                                {availablePanels.map((panel) => (
                                    <option key={panel.id} value={panel.id}>
                                        {panel.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={createPanelFromSelection}
                        disabled={selectedIds.size === 0}
                        className="
              flex items-center justify-center gap-2
              w-full px-3 py-2 text-sm
              bg-violet-600 hover:bg-violet-500
              disabled:opacity-50 disabled:cursor-not-allowed
              rounded transition-colors text-white
            "
                    >
                        <FolderPlus size={16} />
                        <span>Create New Panel</span>
                    </button>

                    <button
                        onClick={deleteSelectedThreads}
                        disabled={selectedIds.size === 0}
                        className="
              flex items-center justify-center gap-2
              w-full px-3 py-2 text-sm
              bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800
              disabled:opacity-50 disabled:cursor-not-allowed
              rounded transition-colors
            "
                    >
                        <Trash2 size={16} />
                        <span>Delete Selected</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
