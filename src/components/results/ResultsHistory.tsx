import { useEffect, useRef } from 'react';
import { useResultsStore } from '../../stores/useResultsStore';
import { ResultCard } from './ResultCard';

export function ResultsHistory() {
  const cards = useResultsStore((state) => state.cards);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show all cards except the last one (which is shown in GlobalLastResult)
  const historyCards = cards.slice(0, -1);

  // Auto-scroll to bottom when new results are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [cards.length]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto app-scroll px-2 pt-2 pb-1 flex flex-col">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Results History
      </h3>

      {historyCards.length === 0 ? (
        <div className="flex-1 flex items-end justify-center pb-8">
          <div className="text-sm text-slate-500">
            No results yet. Roll some dice!
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end">
          <div className="space-y-2">
            {/* Show oldest to newest, excluding the last result */}
            {historyCards.map((card) => (
              <ResultCard key={card.id} card={card} defaultExpanded={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
