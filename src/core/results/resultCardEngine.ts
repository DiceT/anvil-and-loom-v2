import { ResultCard, ResultSource } from './types';
import { useResultsStore } from '../../stores/useResultsStore';

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

  // Persist to IPC
  const allCards = useResultsStore.getState().cards;
  if (window.electron) {
    window.electron.tapestry.saveResults(allCards).catch((error) => {
      console.error('Failed to save results:', error);
    });
  }
}
