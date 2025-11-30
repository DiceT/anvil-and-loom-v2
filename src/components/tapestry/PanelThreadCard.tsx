import { useState } from 'react';
import { Dice1, Scroll, Sparkles } from 'lucide-react';
import { ThreadModel } from '../../types/tapestry';

interface PanelThreadCardProps {
    card: ThreadModel;
    defaultExpanded?: boolean;
}

const sourceColors: Record<string, string> = {
    dice: '#222244',
    aspect: '#224433',
    domain: '#224433',
    oracle: '#332244',
    weave: '#685431',
    table: '#224422',
};

export function PanelThreadCard({ card, defaultExpanded = false }: PanelThreadCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const headerBgColor = sourceColors[card.type] || '#1e293b';

    // Generate timestamp from card timestamp
    const timestamp = new Date(card.timestamp).toLocaleTimeString();

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col my-2">
            {/* Header - Clickable Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3 py-1 border-b border-slate-700 text-left transition-opacity hover:opacity-90 focus:outline-none flex justify-between items-center"
                style={{ backgroundColor: headerBgColor }}
            >
                <span className="text-sm font-bold" style={{ color: '#eeffff' }}>
                    {card.source}
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
                    maxHeight: isExpanded ? '500px' : '0px',
                    opacity: isExpanded ? 1 : 0,
                }}
            >
                <div className="px-2 py-2 text-sm text-slate-400 whitespace-pre-wrap">
                    {/* Display content if available (for table rolls, oracles, etc) */}
                    {card.content && (
                        <div>{card.content}</div>
                    )}
                    {/* Display payload details for dice rolls */}
                    {!card.content && card.payload && typeof card.payload === 'object' && (
                        <div className="space-y-1">
                            {card.payload.rolls && Array.isArray(card.payload.rolls) && (
                                <div>
                                    <span className="text-slate-500">Rolls: </span>
                                    {card.payload.rolls.map((roll: any, i: number) => (
                                        <span key={i} className={roll.kept ? 'font-bold text-slate-200' : ''}>
                                            {roll.value}{i < card.payload.rolls.length - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {card.payload.modifier !== undefined && card.payload.modifier !== 0 && (
                                <div>
                                    <span className="text-slate-500">Modifier: </span>
                                    <span>{card.payload.modifier > 0 ? '+' : ''}{card.payload.modifier}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer - Always Visible */}
            <div className="px-3 py-1.5 border-t border-slate-700">
                <div className="text-slate-100 text-sm whitespace-pre-wrap">
                    {card.summary}
                </div>
            </div>
        </div>
    );
}
