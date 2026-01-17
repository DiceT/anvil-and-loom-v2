import { useState } from 'react';
import { Sparkles, Table } from 'lucide-react';
import { Thread } from '../../core/results/types';
import { resolveThreadColor } from '../../constants/theme';

interface ThreadCardProps {
  card: Thread;
  defaultExpanded?: boolean;
}

export function ThreadCard({ card, defaultExpanded = false }: ThreadCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Use shared resolver for consistency
  const headerBgColor = resolveThreadColor(card.source || undefined, 'oracle');

  // Generate timestamp from card timestamp
  const timestamp = card.timestamp ? new Date(card.timestamp).toLocaleTimeString() : '';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col my-2">
      {/* Header - Clickable Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex-1 px-3 py-1 border-b border-slate-700 text-left transition-opacity hover:opacity-90 focus:outline-none flex justify-between items-center"
        style={{ backgroundColor: headerBgColor }}
      >
        <span className="text-sm font-bold flex items-center gap-2" style={{ color: '#eeffff' }}>
          {card.source === 'interpretation' && <Sparkles className="w-3 h-3" />}
          {card.source === 'weave' && <Table className="w-3 h-3" />}
          {card.header}
        </span>
        <span
          className="text-xs"
          style={{ color: '#eeffff', opacity: 0.7 }}
        >
          {timestamp}
        </span>
      </button>

      {/* Content - Collapsible */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '1000px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="px-2 py-2 text-sm text-slate-400 whitespace-pre-wrap">
          {/* Display content if available */}
          {card.content && (
            <div>{card.content}</div>
          )}
          {/* Display meta details for dice rolls */}
          {!card.content && card.meta && typeof card.meta === 'object' && (
            <div className="space-y-1">
              {card.meta.expression && typeof card.meta.expression === 'string' && (
                <div>
                  <span className="text-slate-500">Expression: </span>
                  <span>{card.meta.expression}</span>
                </div>
              )}
              {card.meta.breakdown && Array.isArray(card.meta.breakdown) && (
                <div>
                  <span className="text-slate-500">Rolls: </span>
                  {card.meta.breakdown.map((roll: any, i: number) => (
                    <span key={i} className={roll.kept ? 'font-bold text-slate-200' : ''}>
                      {roll.value}{i < card.meta.breakdown.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
              {card.meta.total !== undefined && card.meta.total !== null && (
                <div>
                  <span className="text-slate-500">Total: </span>
                  <span className="font-bold text-slate-200">{String(card.meta.total)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer - Always Visible */}
      <div className="px-3 py-1.5 border-t border-slate-700">
        <div className="text-slate-100 text-sm whitespace-pre-wrap">
          {card.result}
        </div>
      </div>
    </div>
  );
}
