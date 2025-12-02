import { Eraser, ArrowDownToLine } from 'lucide-react';
import { useThreadsStore } from '../../stores/useThreadsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { ThreadCard } from './ThreadCard';
import { IconButton } from '../ui/IconButton';

export function GlobalLastThread() {
  const threads = useThreadsStore((state) => state.threads);
  const clearCards = useThreadsStore((state) => state.clearCards);
  const { settings, updateDiceSettings } = useSettingsStore();
  const { insertThreadAtCursor } = useEditorStore();
  const lastCard = threads[threads.length - 1];

  if (!lastCard) {
    return (
      <div className="bg-slate-900 px-2 py-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Latest Thread
          </h3>
        </div>
        <div className="text-xs text-slate-600 text-center py-4">
          No threads yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 px-2 pt-2 pb-2 flex flex-col" style={{ maxHeight: '300px' }}>
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Latest Thread
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateDiceSettings({ logToEntry: !settings.dice.logToEntry })}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${settings.dice.logToEntry
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            title="Auto-log threads to the active panel"
          >
            AUTO
          </button>
          <IconButton
            icon={ArrowDownToLine}
            size="s"
            onClick={() => insertThreadAtCursor(lastCard)}
            tooltip="Append to Entry"
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
