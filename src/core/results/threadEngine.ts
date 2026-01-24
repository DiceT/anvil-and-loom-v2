import { Thread, ResultSource } from './types';
import { useThreadsStore } from '../../stores/useThreadsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSessionStore } from '../../stores/useSessionStore';
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

  // 2. Log to Active Session
  const { activeSessionId } = useSessionStore.getState();
  const { activeEntryId, openEntries, updateEntryContent, saveEntry } = useEditorStore.getState();

  // Helper to append thread to an entry
  const appendThreadToEntry = (entry: typeof openEntries[0]) => {
    // Convert Thread to embedded Panel Thread model
    const typeMap: Record<ResultSource, ThreadType> = {
      dice: 'dice',
      interpretation: 'ai',
      system: 'ai',
      user: 'user',
      weave: 'oracle', // Oracle/Weave now has its own type
      other: 'ai',
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

    const newContent = appendThread(entry.content, panelThread);
    updateEntryContent(entry.id, newContent);
    saveEntry(entry.id);
  };

  if (activeSessionId) {
    const sessionEntry = openEntries.find((e) => e.id === activeSessionId);
    if (sessionEntry) {
      appendThreadToEntry(sessionEntry);
    }
  }

  // 3. Log to Active Entry (if Auto-Log enabled AND it's not the same as the session)
  // We log to both if they are different files.
  if (settings.dice.logToEntry) {
    if (activeEntryId && activeEntryId !== activeSessionId) {
      const activeEntry = openEntries.find((e) => e.id === activeEntryId);

      if (activeEntry) {
        appendThreadToEntry(activeEntry);
      }
    }
  }
}
