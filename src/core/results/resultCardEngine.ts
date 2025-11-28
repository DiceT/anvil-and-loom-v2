import { ResultCard, ResultSource } from './types';
import { useResultsStore } from '../../stores/useResultsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { createResultCard, appendResultCard } from '../../lib/tapestry/resultCardEngine';
import { ResultCardType } from '../../types/tapestry';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface LogResultCardInput {
  header: string;
  result: string;
  content: string;
  source?: ResultSource;
  meta?: Record<string, unknown>;
}

export function logResultCard(input: LogResultCardInput): void {
  const card: ResultCard = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    header: input.header,
    result: input.result,
    content: input.content,
    source: input.source || 'other',
    meta: input.meta,
  };

  // Add to store
  useResultsStore.getState().addCard(card);

  // Note: saveResults IPC method doesn't exist yet, skip for now
  // const allCards = useResultsStore.getState().cards;
  // if (window.electron) {
  //   window.electron.tapestry.saveResults(allCards).catch((error: any) => {
  //     console.error('Failed to save results:', error);
  //   });
  // }

  // Conditionally append to active entry if logToEntry is enabled
  const { settings } = useSettingsStore.getState();
  console.log('[logResultCard] logToEntry setting:', settings.dice.logToEntry);

  if (settings.dice.logToEntry) {
    const { activeEntryId, openEntries, updateEntryContent, saveEntry } = useEditorStore.getState();
    console.log('[logResultCard] activeEntryId:', activeEntryId);
    console.log('[logResultCard] openEntries count:', openEntries.length);

    if (activeEntryId) {
      const activeEntry = openEntries.find(e => e.id === activeEntryId);
      console.log('[logResultCard] activeEntry found:', !!activeEntry);

      if (activeEntry) {
        // Convert ResultCard to ResultCardModel format
        // Map source to ResultCardType
        const typeMap: Record<ResultSource, ResultCardType> = {
          'dice': 'dice',
          'aspect': 'aspect',
          'domain': 'domain',
          'oracle': 'oracle',
          'weave': 'weave',
          'table': 'table',
          'interpretation': 'oracle',
          'system': 'oracle',
          'other': 'table'
        };
        const resultCardModel = createResultCard(
          typeMap[input.source || 'other'],
          input.header,
          input.result,
          input.meta || {},
          input.meta?.expression as string | undefined,
          input.content
        );
        const newContent = appendResultCard(activeEntry.content, resultCardModel);
        console.log('[logResultCard] Appending result card to entry. New length:', newContent.length);
        updateEntryContent(activeEntryId, newContent);

        // Auto-save the entry after adding the result card
        console.log('[logResultCard] Triggering auto-save for entry:', activeEntryId);
        saveEntry(activeEntryId);
      }
    }
  }
}
