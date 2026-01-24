import { useNodeViewContext } from '@prosemirror-adapter/react';
import { ThreadCard } from '../../../components/thread/ThreadCard';
import { panelThreadToThread } from '../../thread/adapters';
import { ThreadModel } from '../../../types/tapestry';
import { analyzeThread } from '../../thread/threadAnalyzer';
import { getAvailableActions } from '../../thread/actions/registry';
import { useEditorStore } from '../../../stores/useEditorStore';
import { useStitchStore } from '../../../stores/useStitchStore';

export const ThreadCardNodeView = () => {
    const { node } = useNodeViewContext();
    const threadData = node.attrs.threadData as ThreadModel;

    // TODO: Get real context settings
    const actionContext = {
        activeSessionId: 'current',
        activePanelId: 'current',
        aiConfigured: true,
    };

    if (!threadData) {
        return (
            <div className="p-4 border border-red-500 rounded bg-red-900/20 text-red-200">
                Invalid Thread Data
            </div>
        );
    }

    // Adapt to new Thread model
    const thread = panelThreadToThread(threadData);

    // Analyze and get actions
    const analysis = analyzeThread(thread);
    const actions = getAvailableActions(thread, analysis, actionContext);

    // Action Handler
    const handleAction = async (action: any, thread: any) => {
        try {
            const newThreads = await action.execute(thread, actionContext);

            // If new threads were created (e.g. clock, track, interpretation), append them
            if (newThreads && newThreads.length > 0) {
                // For now, we just log them. 
                // In a real implementation, we would append to the document.
                // Since this is a NodeView, modifying the doc is tricky but we can use commands.
                // HOWEVER, for Phase 0 parity, we just need to confirm they run.
                // Let's actually append them to the active panel using the store.
                const { activeEntryId, updateEntryContent, openEntries, saveEntry } = useEditorStore.getState();

                const entry = openEntries.find(e => e.id === activeEntryId);

                if (entry) {
                    const { appendThread } = await import('../../tapestry/threadEngine');
                    const { createThread } = await import('../../tapestry/threadEngine');

                    let content = entry.content;

                    for (const newThread of newThreads) {
                        try {
                            // Adapt back to PanelThreadModel for storage
                            // Use explicit 'oracle' type if source is weave
                            let type: any = 'dice';
                            if (newThread.type === 'ai_text') type = 'ai';
                            if (newThread.type === 'oracle') type = 'oracle';
                            if (newThread.source === 'clock') type = 'system'; // Clocks are system/meta
                            if (newThread.source === 'track') type = 'system';

                            let sourceOverride = newThread.source;
                            if (newThread.source === 'clock') sourceOverride = 'Clock Created';
                            if (newThread.source === 'track') sourceOverride = 'Progress Track Created';

                            const panelThread = createThread(
                                type,
                                sourceOverride,
                                newThread.summary,
                                {
                                    ...newThread.meta,
                                    clock: newThread.clock,
                                    track: newThread.track
                                },
                                newThread.meta?.expression,
                                newThread.content,
                                newThread.timestamp
                            );

                            content = appendThread(content, panelThread);
                        } catch (loopError) {
                            console.error('Failed to append thread:', newThread, loopError);
                        }
                    }

                    updateEntryContent(entry.id, content);
                    saveEntry(entry.id);
                }
            }
        } catch (e) {
            console.error('Action failed:', e);
        }
    };

    // State Update Handler
    const handleUpdate = async (updates: any) => {
        console.log('[ThreadCardNodeView] handleUpdate called', { threadId: thread.id, updates });
        const { activeEntryId, updateEntryContent, openEntries, saveEntry } = useEditorStore.getState();

        const entry = openEntries.find(e => e.id === activeEntryId);
        if (!entry) {
            console.error('[ThreadCardNodeView] No active entry found', { activeEntryId });
            return;
        }

        // 1. Update Document
        const { updateThreadInContent } = await import('../../tapestry/contentUpdates');
        console.log('[ThreadCardNodeView] calling updateThreadInContent');
        const newContent = updateThreadInContent(entry.content, thread.id, updates);

        if (newContent) {
            console.log('[ThreadCardNodeView] Content updated, saving to store');
            updateEntryContent(entry.id, newContent);
            saveEntry(entry.id);
        } else {
            console.warn('[ThreadCardNodeView] updateThreadInContent returned null (no match found)');
        }

        // 2. Sync to History Store (Bi-directional)
        const { useThreadsStore } = await import('../../../stores/useThreadsStore');
        useThreadsStore.getState().updateThread(thread.id, updates);
    };

    return (
        <div contentEditable={false} className="select-none not-prose text-slate-200 my-2">
            <ThreadCard
                thread={thread}
                mode="embedded"
                defaultExpanded={false}
                actions={actions}
                onAction={handleAction}
                onUpdate={handleUpdate}
            />
        </div>
    );
};
