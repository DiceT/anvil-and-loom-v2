import { useEffect } from 'react';
import { Eraser, ArrowDownToLine } from 'lucide-react';
import { useThreadsStore } from '../../stores/useThreadsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { ThreadCard } from './ThreadCard';
import { IconButton } from '../ui/IconButton';
import { diceEngine } from '../../integrations/anvil-dice-app';
import { logThread } from '../../core/results/threadEngine';

import { useDifficultyStore } from '../../stores/useDifficultyStore';

export function GlobalLastThread() {
  const threads = useThreadsStore((state) => state.threads);
  const clearCards = useThreadsStore((state) => state.clearCards);
  const { settings, updateDiceSettings } = useSettingsStore();
  const { insertThreadAtCursor } = useEditorStore();
  const lastCard = threads[threads.length - 1];

  useEffect(() => {
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
      // FIX: Read latest settings directly from store to avoid stale closure in useEffect
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

    return () => {
      diceEngine.off('rollComplete', handleRollComplete);
    };
  }, []);

  if (!lastCard) {
    return (
      <div className="bg-canvas-panel px-2 py-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold text-type-tertiary uppercase tracking-wide">
            Latest Thread
          </h3>
        </div>
        <div className="text-xs text-type-tertiary text-center py-4">
          No threads yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas-panel px-2 pt-2 pb-2 flex flex-col" style={{ maxHeight: '300px' }}>
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <h3 className="text-xs font-semibold text-type-tertiary uppercase tracking-wide">
          Latest Thread
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateDiceSettings({ logToEntry: !settings.dice.logToEntry })}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${settings.dice.logToEntry
              ? 'bg-amethyst text-white'
              : 'bg-canvas-surface hover:bg-canvas text-type-tertiary'
              }`}
            title="Toggle auto-logging threads to the active panel"
          >
            Auto-Add
          </button>
          <IconButton
            icon={ArrowDownToLine}
            size="s"
            onClick={() => insertThreadAtCursor(lastCard)}
            tooltip="Insert Thread (Manual)"
          />
          <IconButton
            icon={Eraser}
            size="s"
            onClick={clearCards}
            tooltip="Clear all results"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto app-scroll min-h-0">
        <ThreadCard card={lastCard} defaultExpanded={true} />
      </div>
    </div>
  );
}
