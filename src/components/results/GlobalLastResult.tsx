import { useResultsStore } from '../../stores/useResultsStore';
import { ResultCard } from './ResultCard';

export function GlobalLastResult() {
  const cards = useResultsStore((state) => state.cards);
  const lastCard = cards[cards.length - 1];

  if (!lastCard) {
    return (
      <div className="border-t border-slate-800 bg-slate-900 px-3 py-3">
        <h3 className="text-xs font-semibold text-slate-500 mb-2">
          Last Result
        </h3>
        <div className="text-xs text-slate-600 text-center py-4">
          No results yet
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800 bg-slate-900 px-3 py-3">
      <h3 className="text-xs font-semibold text-slate-500 mb-2">Last Result</h3>
      <ResultCard card={lastCard} />
    </div>
  );
}
