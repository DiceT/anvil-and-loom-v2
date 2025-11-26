import { useState } from 'react';
import { ResultCard as ResultCardType } from '../../core/results/types';

interface ResultCardProps {
  card: ResultCardType;
  defaultExpanded?: boolean;
}

const sourceColors: Record<string, string> = {
  dice: '#222244',
  aspect: '#224433',  // Green-ish for Aspects
  domain: '#224433',  // Green-ish for Domains
  table: '#224422',   // General table (legacy)
  oracle: '#332244',  // Purple-ish for Oracles
  interpretation: '#442244',
  weave: '#685431',   // The Weave's gold/brown
  system: '#1e293b',
  other: '#1e293b',
};

export function ResultCard({ card, defaultExpanded = false }: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const headerBgColor = sourceColors[card.source || 'other'];
  const timestamp = new Date(card.timestamp).toLocaleTimeString();

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
      {/* Header - Clickable Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-2 border-b border-slate-700 text-left transition-opacity hover:opacity-90 focus:outline-none"
        style={{ backgroundColor: headerBgColor }}
      >
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold" style={{ color: '#eeffff' }}>
            {card.header}
          </h4>
          <span
            className="text-xs"
            style={{ color: '#eeffff', opacity: 0.7 }}
          >
            {timestamp}
          </span>
        </div>
      </button>

      {/* Content - Collapsible */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '500px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div
          className="px-3 py-3 text-sm text-slate-400 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: card.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
          }}
        />
      </div>

      {/* Footer - Always Visible */}
      <div className="px-3 py-3 border-t border-slate-700">
        <div className={`font-bold text-slate-100 ${card.source === 'dice' ? 'text-2xl' : 'text-base'}`}>
          {card.result}
        </div>
      </div>
    </div>
  );
}
