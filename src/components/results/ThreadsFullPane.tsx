import { useEffect, useRef } from 'react';
import { useThreadsStore } from '../../stores/useThreadsStore';
import { ThreadCard } from './ThreadCard';

export function ThreadsFullPane() {
  const threads = useThreadsStore((state) => state.threads);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Exclude the last card (shown in GlobalLastResult)
  const allThreadsCards = threads.slice(0, -1);

  // Scroll to bottom when new cards are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allThreadsCards.length]);

  return (
    <div className="px-2 pt-2 pb-2 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Thread History
      </h3>

      {allThreadsCards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-slate-500">No threads yet. Roll some dice or pull a thread!</div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto app-scroll">
          <div className="space-y-2">
            {allThreadsCards.map((card) => (
              <ThreadCard key={card.id} card={card} defaultExpanded={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
