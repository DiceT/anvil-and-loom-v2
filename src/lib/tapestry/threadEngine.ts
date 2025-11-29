import { v4 as uuidv4 } from 'uuid';
import { PanelThreadModel, ThreadType } from '../../types/tapestry';

/**
 * NOTE:
 * These helpers still retain their original function names for now
 * (`createResultCard`, `serializeResultCard`, `appendResultCard`) to avoid
 * breaking imports. They operate on PanelThreadModel, which is the canonical
 * embedded Thread representation inside Panels.
 */

export const createThread = (
  type: ThreadType,
  source: string,
  summary: string,
  payload: any,
  expression: string | undefined,
  content: string | undefined,
  timestamp: string
): PanelThreadModel => {
  return {
    id: uuidv4(),
    type,
    source,
    summary,
    content,
    payload,
    expression,
    timestamp,
  };
};

export const serializeThread = (card: PanelThreadModel): string => {
  const json = JSON.stringify(card, null, 2);
  return `\n\`\`\`result-card\n${json}\n\`\`\`\n`;
};

export const appendThread = (currentMarkdown: string, card: PanelThreadModel): string => {
  const cardMarkdown = serializeThread(card);
  // Ensure we append with a newline if needed
  const separator = currentMarkdown.endsWith('\n') ? '' : '\n';
  return `${currentMarkdown}${separator}${cardMarkdown}`;
};
