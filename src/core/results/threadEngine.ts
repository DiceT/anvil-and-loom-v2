import { Thread, ResultSource } from './types';
import { useThreadsStore } from '../../stores/useThreadsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { createThread, appendThread } from '../../lib/tapestry/threadEngine';
import { ThreadType } from '../../types/tapestry';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface LogThreadInput {
  header: string;
  result: string;
  content: string;
  source?: ResultSource;
  meta?: Record<string, unknown>;
}

export function logThread(input: LogThreadInput): void {
  const thread: Thread = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    header: input.header,
    result: input.result,
    content: input.content,
    source: input.source || 'other',
    meta: input.meta,
  };

  // Add to store
  useThreadsStore.getState().addThread(thread);

  const { settings } = useSettingsStore.getState();

  if (settings.dice.logToEntry) {
    const { activeEntryId, openEntries, updateEntryContent, saveEntry } = useEditorStore.getState();

    if (activeEntryId) {
      const activeEntry = openEntries.find((e) => e.id === activeEntryId);

      if (activeEntry) {
        // Convert Thread to embedded Panel Thread model
        const typeMap: Record<ResultSource, ThreadType> = {
          dice: 'dice',
          aspect: 'aspect',
          domain: 'domain',
          oracle: 'oracle',
          weave: 'weave',
          table: 'table',
          interpretation: 'oracle',
          system: 'oracle',
          other: 'table',
        };

        const panelThread = createThread(
          typeMap[input.source || 'other'],
          input.header,
          input.result,
          input.meta || {},
          (input.meta?.expression as string | undefined) || undefined,
          input.content,
          thread.timestamp,
        );

        const newContent = appendThread(activeEntry.content, panelThread);
        updateEntryContent(activeEntryId, newContent);

        saveEntry(activeEntryId);
      }
    }
  }
}
