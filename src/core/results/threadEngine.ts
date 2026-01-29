import { Thread, ThreadSource, ThreadType } from '../../types/thread';
import { useThreadsStore } from '../../stores/useThreadsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { diceEngine } from '../../integrations/anvil-dice-app';
import { useDifficultyStore } from '../../stores/useDifficultyStore';
import {
  generateDiceThreadMarkdown,
  generateThreadMarkdown,
} from '../../lib/editor/generators/threadMarkdownGenerator';
import { ThreadType as ContainerThreadType } from '../../lib/editor/types/threadTypes';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

let isInitialized = false;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LogThreadInput {
  header: string;
  result: string;
  content: string;
  source?: string;
  intent?: Thread['intent'];
  meta?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Log Thread
// ─────────────────────────────────────────────────────────────────────────────

export function logThread(input: LogThreadInput): void {
  // Map input source to types
  let source: ThreadSource = 'system';
  let type: ThreadType = 'system';
  let containerType: ContainerThreadType = 'system';
  const inputSource = input.source?.toLowerCase() || 'other';

  if (inputSource === 'dice') {
    source = 'dice';
    type = 'roll';
    containerType = 'dice';
  } else if (inputSource === 'weave') {
    source = 'weave';
    type = 'oracle';
    containerType = 'oracle';
  } else if (inputSource === 'interpretation' || inputSource === 'ai') {
    source = 'ai';
    type = 'ai_text';
    containerType = 'ai';
  } else if (inputSource === 'user') {
    source = 'user';
    type = 'user';
    containerType = 'user';
  }

  const threadId = generateId();

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Create Unified Thread Object (for History Sidebar)
  // ─────────────────────────────────────────────────────────────────────────

  const thread: Thread = {
    id: threadId,
    timestamp: new Date().toISOString(),
    header: input.header,
    summary: input.result,
    content: input.content,
    source: source,
    type: type,
    intent: input.intent || 'consequence',
    visibility: 'visible',
    meta: input.meta,
    createdBy: source === 'user' ? 'user' : 'system',
  };

  useThreadsStore.getState().addThread(thread);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Generate Markdown for Panel
  // ─────────────────────────────────────────────────────────────────────────

  let markdown = '';

  if (containerType === 'dice') {
    // Extract dice data from meta
    const meta = input.meta || {};
    const expression = (meta.expression || meta.notation || 'Roll') as string;
    const breakdown = (meta.breakdown || meta.dice || []) as any[];
    const rolls = breakdown.map((r: any) => r.value);
    const total = (meta.total ?? 0) as number;
    const dc = meta.dc as number | undefined;
    const success = dc !== undefined ? total >= dc : undefined;

    markdown = generateDiceThreadMarkdown({
      id: threadId,
      expression,
      rolls,
      total,
      dc,
      success,
    });
  } else if (containerType === 'oracle') {
    // Oracle/Weave result
    const meta = input.meta || {};

    // Format meta as readable text
    let metaText = '';
    if (meta.tableChain && Array.isArray(meta.tableChain)) {
      metaText = `Tables: ${(meta.tableChain as string[]).join(' → ')}`;
    }
    if (meta.rollValue !== undefined) {
      metaText += metaText ? '\n' : '';
      metaText += `Roll: ${meta.rollValue}`;
    }

    markdown = generateThreadMarkdown({
      id: threadId,
      type: 'oracle',
      header: `🎴 ${input.header}`,
      meta: metaText || undefined,
      result: input.result,
      content: input.content || undefined,
    });
  } else if (containerType === 'ai') {
    markdown = generateThreadMarkdown({
      id: threadId,
      type: 'ai',
      header: `✨ ${input.header}`,
      content: input.content || input.result,
    });
  } else if (containerType === 'user') {
    markdown = generateThreadMarkdown({
      id: threadId,
      type: 'user',
      header: `📝 ${input.header}`,
      content: input.content || input.result,
    });
  } else {
    // System/Other - generic
    markdown = generateThreadMarkdown({
      id: threadId,
      type: containerType,
      header: input.header,
      result: input.result,
      content: input.content,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Append to Panels
  // ─────────────────────────────────────────────────────────────────────────

  const { settings } = useSettingsStore.getState();
  const { activeSessionId } = useSessionStore.getState();
  const { activeEntryId, openEntries, updateEntryContent, saveEntry } =
    useEditorStore.getState();

  const appendThreadToEntry = (entry: (typeof openEntries)[0]) => {
    const spacing = entry.content.endsWith('\n\n')
      ? ''
      : entry.content.endsWith('\n')
        ? '\n'
        : '\n\n';
    const newContent = entry.content + spacing + markdown;

    updateEntryContent(entry.id, newContent);
    saveEntry(entry.id);
  };

  // Log to active session
  if (activeSessionId) {
    const sessionEntry = openEntries.find((e) => e.id === activeSessionId);
    if (sessionEntry) {
      appendThreadToEntry(sessionEntry);
    }
  }

  // Log to active entry (if enabled and different from session)
  if (settings.dice.logToEntry) {
    if (activeEntryId && activeEntryId !== activeSessionId) {
      const activeEntry = openEntries.find((e) => e.id === activeEntryId);
      if (activeEntry) {
        appendThreadToEntry(activeEntry);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Thread Engine (Dice Listener)
// ─────────────────────────────────────────────────────────────────────────────

export function initializeThreadEngine(): () => void {
  if (isInitialized) return () => { };
  isInitialized = true;

  const handleRollComplete = (result: any) => {
    if (result.meta?.suppressLog) {
      return;
    }

    // Format rolls for display
    const breakdown = result.breakdown || [];
    const rollsText = breakdown
      .map((r: any) => (r.kept !== false ? `**${r.value}**` : `~~${r.value}~~`))
      .join(', ');

    // Resolution logic
    const { isEnabled, targetNumber, tierDifferential, setIsEnabled } =
      useDifficultyStore.getState();
    const currentSettings = useSettingsStore.getState().settings;
    // const resolutionMethod = currentSettings.mechanics?.resolutionMethod || 'dc-2'; // Unused

    // let headerText = `DICE: ${result.expression || 'Roll'}`; // Unused
    let resultText = `${result.total}`;
    // let contentText = `Expression: ${result.expression || ''}\nRolls: ${rollsText}`; // Unused
    let resolutionData: any = {};

    // ─────────────────────────────────────────────────────────────────────
    // Action Roll (Ironsworn-style)
    // ─────────────────────────────────────────────────────────────────────

    if (isEnabled && result.total !== undefined) {
      // IronSworn: Action Die vs Challenge Dice
      // For now, let's assume standard DC behavior if not using full IronSworn logic

      // If we are using Iron Sworn mechanics, we need challenge dice.
      // But here we are just logging the result.

      // Simplified Diff logic for now
      // const diff = tierDifferential || 0; // Unused
      const target = targetNumber || 15;

      const success = result.total >= target;

      resolutionData = {
        dc: target,
        success
      };

      resultText = `${result.total} (vs ${target})`;
    }

    logThread({
      header: resolutionData.dc ? `Roll: ${result.expression}` : `Roll: ${result.expression}`,
      result: `Total: ${resultText}`,
      content: '',
      source: 'dice',
      meta: {
        ...result,
        ...resolutionData
      },
    });
  };

  diceEngine.on('rollComplete', handleRollComplete);

  return () => {
    diceEngine.off('rollComplete', handleRollComplete);
    isInitialized = false;
  };
}
