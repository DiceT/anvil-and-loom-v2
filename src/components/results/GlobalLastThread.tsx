import { Eraser, ArrowDownToLine } from 'lucide-react';
import { useThreadsStore } from '../../stores/useThreadsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { ThreadCard } from '../thread/ThreadCard';
import { IconButton } from '../ui/IconButton';

export function GlobalLastThread() {
  const threads = useThreadsStore((state) => state.threads);
  const clearThreads = useThreadsStore((state) => state.clearThreads);
  const { settings, updateDiceSettings } = useSettingsStore();
  const { insertThreadAtCursor } = useEditorStore();
  const lastThread = threads[threads.length - 1];



  if (!lastThread) {
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
            onClick={() => insertThreadAtCursor(lastThread)}
            tooltip="Insert Thread (Manual)"
          />
          <IconButton
            icon={Eraser}
            size="s"
            onClick={clearThreads}
            tooltip="Clear all results"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto app-scroll min-h-0">
        <ThreadCard
          thread={lastThread}
          mode="history"
          defaultExpanded={true}
        // Minimal actions for the footer card if needed
        />
      </div>
    </div>
  );
}
