import { Thread, ThreadSource, ThreadType } from '../../types/thread';
import { useThreadsStore } from '../../stores/useThreadsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { createThread as createPanelThread, appendThread } from '../../lib/tapestry/threadEngine';
import { ThreadType as PanelThreadType } from '../../types/tapestry';
import { diceEngine } from '../../integrations/anvil-dice-app';
import { useDifficultyStore } from '../../stores/useDifficultyStore';

// Initialize the engine listeners
let isInitialized = false;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface LogThreadInput {
  header: string;
  result: string;
  content: string;
  source?: string; // Relaxed type to accept loose strings until fully migrated
  meta?: Record<string, unknown>;
}

export function logThread(input: LogThreadInput): void {
  // Map input source to Unified Thread Source & Type
  let source: ThreadSource = 'system';
  let type: ThreadType = 'system';
  const inputSource = input.source?.toLowerCase() || 'other';

  if (inputSource === 'dice') {
    source = 'dice';
    type = 'roll';
  } else if (inputSource === 'weave') {
    source = 'weave';
    type = 'oracle';
  } else if (inputSource === 'interpretation' || inputSource === 'ai') {
    source = 'ai';
    type = 'ai_text';
  } else if (inputSource === 'user') {
    source = 'user';
    type = 'user';
  }

  const thread: Thread = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    header: input.header,
    summary: input.result, // Map result -> summary
    content: input.content,
    source: source,
    type: type,
    intent: 'consequence',
    visibility: 'visible',
    meta: input.meta,
    createdBy: source === 'user' ? 'user' : 'system'
  };

  // Add to store
  useThreadsStore.getState().addThread(thread);

  const { settings } = useSettingsStore.getState();

  // 2. Log to Active Session
  const { activeSessionId } = useSessionStore.getState();
  const { activeEntryId, openEntries, updateEntryContent, saveEntry } = useEditorStore.getState();

  // Helper to append thread to an entry
  const appendThreadToEntry = (entry: typeof openEntries[0]) => {
    // Convert logic for Panel Thread (Tapestry)
    // We can reuse the Unified Thread info mostly, but Tapestry engine has its own createThread
    // that expects specific arguments.

    // Map Unified/Input to Panel Thread Type
    let panelType: PanelThreadType = 'ai';
    if (source === 'dice') panelType = 'dice';
    if (source === 'weave') panelType = 'oracle';
    if (source === 'user') panelType = 'user';
    if (source === 'ai') panelType = 'ai';

    const panelThread = createPanelThread(
      panelType,
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

export function initializeThreadEngine(): () => void {
  if (isInitialized) return () => { };
  isInitialized = true;

  const handleRollComplete = (result: any) => {
    // Format the rolls for display
    const breakdown = result.breakdown || [];
    const rollsText = breakdown
      .map((r: any) => (r.kept ? `**${r.value}**` : `${r.value}`))
      .join(' + ');

    if (result.meta?.suppressLog) {
      return;
    }

    // -- Resolution Logic --
    const { isEnabled, targetNumber, tierDifferential, setIsEnabled } = useDifficultyStore.getState();
    // Read latest settings directly from store
    const currentSettings = useSettingsStore.getState().settings;
    const resolutionMethod = currentSettings.mechanics?.resolutionMethod || 'dc-2';

    let headerText = `DICE: ${result.expression || 'Roll'}`;
    let resultText = `${result.total}`;
    let contentText = `Expression: ${result.expression || ''}\nRolls: ${rollsText}`;
    let resolutionData: any = {};

    // 1. ACTION ROLL (Driven by Metadata from Roll)
    if (result.meta?.resolution === 'action-roll') {
      const bonus = result.meta.actionBonus || 0;

      // Find Dice
      const d6 = breakdown.find((d: any) => d.type === 'd6');
      const d10s = breakdown.filter((d: any) => d.type === 'd10');

      if (d6 && d10s.length === 2) {
        const actionScore = d6.value + bonus;
        const challenge1 = d10s[0].value;
        const challenge2 = d10s[1].value;

        // Ironsworn Logic
        let hits = 0;
        if (actionScore > challenge1) hits++;
        if (actionScore > challenge2) hits++;

        let status = 'MISS';
        if (hits === 1) status = 'WEAK HIT';
        if (hits === 2) status = 'STRONG HIT';

        // Match Logic
        const isMatch = challenge1 === challenge2;
        let matchText = '';

        if (isMatch) {
          if (status === 'STRONG HIT') {
            status = 'STRONG HIT + BOON';
            matchText = ' (MATCH!)';
          } else if (status === 'MISS') {
            status = 'MISS + BANE';
            matchText = ' (MATCH!)';
          }
        }

        // Clean Output
        headerText = `Action Roll`;
        resultText = `${actionScore} vs ${challenge1} | ${challenge2} -> ${status}`;

        // Formatted Content: "d6 + bonus vs d10 | d10 -> RESULT"
        // Example: "4 + 3 vs 2 | 8 -> WEAK HIT"
        contentText = `**${d6.value} + ${bonus}** vs **${challenge1}** | **${challenge2}** -> **${status}**${matchText}`;

        resolutionData = {
          type: 'action-roll',
          status,
          actionScore,
          challengeDice: [challenge1, challenge2],
          match: isMatch
        };
      }
    }
    // 2. DC Checks (Driven by Global State)
    else if (isEnabled) {
      if (resolutionMethod === 'dc-3') {
        // Tiered check
        // Success: >= DC
        // Partial: >= DC + Diff AND < DC
        // Fail: < DC + Diff
        // Diff is negative (e.g. -3)
        const partialThreshold = targetNumber + tierDifferential;

        let status = 'FAILURE';
        let icon = '❌';

        if (result.total >= targetNumber) {
          status = 'SUCCESS';
          icon = '✅';
        } else if (result.total >= partialThreshold) {
          status = 'SUCCESS WITH CONSEQUENCE';
          icon = '⚠️';
        }

        headerText += ` | DC ${targetNumber}/${partialThreshold} ${icon}`;
        resultText = `${result.total} vs ${targetNumber}/${partialThreshold} -> ${status}`;
        contentText += `\n\n**Result:** ${status} (Rolled ${result.total} vs DC ${targetNumber}/${partialThreshold})`;

        resolutionData = { type: 'dc-3', status, dc: targetNumber, threshold: partialThreshold };

      } else {
        // Default DC-2
        const isSuccess = result.total >= targetNumber;
        const status = isSuccess ? 'SUCCESS' : 'FAILURE';
        const icon = isSuccess ? '✅' : '❌';

        headerText += ` | DC ${targetNumber} ${icon}`;
        resultText = `${result.total} vs ${targetNumber} -> ${status}`;
        contentText += `\n\n**Result:** ${status} (Rolled ${result.total} vs DC ${targetNumber})`;

        resolutionData = { type: 'dc-2', status, dc: targetNumber };
      }

      // Auto-disable DC after resolve
      setIsEnabled(false);
    }

    logThread({
      header: headerText,
      result: resultText,
      content: contentText,
      source: result.meta?.resolution === 'action-roll' ? 'dice' : 'dice', // Both are dice source
      meta: {
        ...result,
        ...result.meta, // Merge incoming meta (like actionBonus)
        ...resolutionData,
        dc: isEnabled ? targetNumber : undefined,
      }
    });
  };

  diceEngine.on('rollComplete', handleRollComplete);

  // Return cleanup function for useEffect
  return () => {
    isInitialized = false;
    diceEngine.off('rollComplete', handleRollComplete);
  };
}
