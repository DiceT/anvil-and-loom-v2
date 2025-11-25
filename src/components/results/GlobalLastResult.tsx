import { Eraser } from 'lucide-react';
import { useResultsStore } from '../../stores/useResultsStore';
import { ResultCard } from './ResultCard';
import { IconButton } from '../ui/IconButton';

export function GlobalLastResult() {
  const cards = useResultsStore((state) => state.cards);
  const clearCards = useResultsStore((state) => state.clearCards);
  const lastCard = cards[cards.length - 1];

  if (!lastCard) {
    return (
      <div className="bg-slate-900 px-2 py-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Last Result
          </h3>
        </div>
        <div className="text-xs text-slate-600 text-center py-4">
          No results yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 px-2 pt-2 pb-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Last Result
        </h3>
        <IconButton
          icon={Eraser}
          size="s"
          onClick={clearCards}
          tooltip="Clear all results"
        />
      </div>
      <ResultCard card={lastCard} defaultExpanded={true} />
    </div>
  );
}
