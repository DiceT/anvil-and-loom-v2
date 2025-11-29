import { useEffect, useRef } from 'react';
import { useThreadsStore } from '../../stores/useThreadsStore';
import { ThreadCard } from './ThreadCard';

export function ThreadsHistory() {
  const threads = useThreadsStore((state) => state.threads);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show all cards except the last one (which is shown in GlobalLastResult)
  const historyCards = threads.slice(0, -1);

  // Auto-scroll to bottom when new results are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threads.length]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto app-scroll px-2 pt-2 pb-1 flex flex-col">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Thread History
      </h3>

      {historyCards.length === 0 ? (
        <div className="flex-1 flex items-end justify-center pb-8">
          <div className="text-sm text-slate-500">
            No threads yet. Roll some dice or pull a thread!
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end">
          <div className="space-y-2">
            {/* Show oldest to newest, excluding the last result */}
            {historyCards.map((card) => (
              <ThreadCard key={card.id} card={card} defaultExpanded={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
