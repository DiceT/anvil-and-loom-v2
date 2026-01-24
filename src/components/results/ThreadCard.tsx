import { Thread as LegacyThread } from '../../core/results/types';
import { ThreadCard as NewThreadCard } from '../thread/ThreadCard';
import { legacyThreadToThread } from '../../lib/thread/adapters';
import { analyzeThread } from '../../lib/thread/threadAnalyzer';
import { getAvailableActions } from '../../lib/thread/actions/registry';

interface ThreadCardProps {
  card: LegacyThread;
  defaultExpanded?: boolean;
}

export function ThreadCard({ card, defaultExpanded = false }: ThreadCardProps) {
  // Adapt legacy thread to new model
  const thread = legacyThreadToThread(card);

  // TODO: Get real context
  const actionContext = {
    activeSessionId: 'current',
    activePanelId: 'current',
    aiConfigured: true,
  };

  // Analyze
  const analysis = analyzeThread(thread);
  const actions = getAvailableActions(thread, analysis, actionContext);

  const handleAction = async (action: any, thread: any) => {
    try {
      const newThreads = await action.execute(thread, actionContext);
      if (newThreads && newThreads.length > 0) {
        // 1. Add to History Store
        const { useThreadsStore } = await import('../../stores/useThreadsStore');
        newThreads.forEach(t => useThreadsStore.getState().addThread(t));

        // 2. Auto-Add to Active Entry (if enabled)
        const { useSettingsStore } = await import('../../stores/useSettingsStore');
        const { settings } = useSettingsStore.getState();

        if (settings.dice.logToEntry) {
          const { useEditorStore } = await import('../../stores/useEditorStore');
          // activeEntryId is sufficient usually
          const { activeEntryId, updateEntryContent, openEntries, saveEntry } = useEditorStore.getState();

          if (activeEntryId) {
            const entry = openEntries.find(e => e.id === activeEntryId);
            if (entry) {
              const { appendThread, createThread: createPanelThread } = await import('../../lib/tapestry/threadEngine');

              let content = entry.content;
              for (const newThread of newThreads) {
                // Adapt back to PanelThreadModel for storage
                // Use explicit 'oracle' type if source is weave
                let type: any = 'dice';
                if (newThread.type === 'ai_text') type = 'ai';
                if (newThread.type === 'oracle') type = 'oracle';
                if (newThread.source === 'clock') type = 'system'; // Clocks are system/meta
                if (newThread.source === 'track') type = 'system';

                const panelThread = createPanelThread(
                  type,
                  newThread.source,
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
              }

              updateEntryContent(entry.id, content);
              saveEntry(entry.id);
            }
          }
        }
      }
    } catch (e) {
      console.error("Action execution failed", e);
    }
  };

  const handleUpdate = async (updates: any) => {
    // 1. Update History Store
    const { useThreadsStore } = await import('../../stores/useThreadsStore');
    useThreadsStore.getState().updateThread(card.id, updates);

    // 2. Sync to Active Document (Bi-directional)
    const { useEditorStore } = await import('../../stores/useEditorStore');
    const { activeEntryId, updateEntryContent, openEntries, saveEntry } = useEditorStore.getState();

    if (activeEntryId) {
      const entry = openEntries.find(e => e.id === activeEntryId);
      if (entry) {
        const { updateThreadInContent } = await import('../../lib/tapestry/contentUpdates');
        const newContent = updateThreadInContent(entry.content, card.id, updates);

        if (newContent) {
          updateEntryContent(entry.id, newContent);
          saveEntry(entry.id);
        }
      }
    }
  };

  return (
    <NewThreadCard
      thread={thread}
      mode="history"
      defaultExpanded={defaultExpanded}
      actions={actions}
      onAction={handleAction}
      onUpdate={handleUpdate}
    />
  );
}
