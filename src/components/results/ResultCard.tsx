import { ResultCard as ResultCardType } from '../../core/results/types';

interface ResultCardProps {
  card: ResultCardType;
}

const sourceColors: Record<string, string> = {
  dice: 'bg-blue-900 border-blue-700',
  table: 'bg-green-900 border-green-700',
  oracle: 'bg-cyan-900 border-cyan-700',
  interpretation: 'bg-purple-900 border-purple-700',
  system: 'bg-slate-800 border-slate-600',
  other: 'bg-slate-800 border-slate-600',
};

export function ResultCard({ card }: ResultCardProps) {
  const headerColor = sourceColors[card.source || 'other'];
  const timestamp = new Date(card.timestamp).toLocaleTimeString();

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mb-3">
      {/* Header */}
      <div className={`${headerColor} px-3 py-2 border-b`}>
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold text-slate-100">
            {card.header}
          </h4>
          <span className="text-xs text-slate-400">{timestamp}</span>
        </div>
      </div>

      {/* Result (snapshot) */}
      <div className="px-3 py-3">
        <div className="text-xl font-bold text-slate-100 mb-2">
          {card.result}
        </div>

        {/* Content (breakdown) */}
        <div className="text-sm text-slate-400 whitespace-pre-wrap">
          {card.content}
        </div>
      </div>
    </div>
  );
}
