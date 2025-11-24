import { useResultsStore } from '../../stores/useResultsStore';
import { ResultCard } from './ResultCard';

export function ResultsHistory() {
  const cards = useResultsStore((state) => state.cards);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3">
      <h3 className="text-sm font-semibold text-slate-400 mb-3">
        Results History
      </h3>

      {cards.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8">
          No results yet. Roll some dice!
        </div>
      ) : (
        <div className="space-y-0">
          {/* Reverse array to show most recent first */}
          {[...cards].reverse().map((card) => (
            <ResultCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
