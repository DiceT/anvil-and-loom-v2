import { useEffect, useRef } from 'react';
import { useResultsStore } from '../../stores/useResultsStore';
import { ResultCard } from './ResultCard';

export function ResultsFullPane() {
  const cards = useResultsStore((state) => state.cards);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Exclude the last card (shown in GlobalLastResult)
  const allResultsCards = cards.slice(0, -1);

  // Scroll to bottom when new cards are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allResultsCards.length]);

  return (
    <div className="px-2 pt-2 pb-2 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        All Results
      </h3>

      {allResultsCards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-slate-500">No results yet</div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto app-scroll">
          <div className="space-y-2">
            {allResultsCards.map((card) => (
              <ResultCard key={card.id} card={card} defaultExpanded={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
