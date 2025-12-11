import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { ThreadModel } from '../../types/tapestry';
import { useAiStore } from '../../stores/useAiStore';
import { resolveThreadColor } from '../../constants/theme';

interface PanelThreadCardProps {
    card: ThreadModel;
    defaultExpanded?: boolean;
    onInterpretWithAi?: () => Promise<void>;
}



export function PanelThreadCard({ card, defaultExpanded = false, onInterpretWithAi }: PanelThreadCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isInterpreting, setIsInterpreting] = useState(false);
    const { isConfigured } = useAiStore();
    // Use shared resolver for consistency
    const headerBgColor = resolveThreadColor(card.source || undefined, card.type);

    // Generate timestamp from card timestamp
    const timestamp = card.timestamp ? new Date(card.timestamp).toLocaleTimeString() : '';

    // Check if this is a First Look thread
    const isFirstLook = card.source?.startsWith('First Look');

    const handleInterpret = async () => {
        if (!onInterpretWithAi) return;

        setIsInterpreting(true);
        try {
            await onInterpretWithAi();
        } catch (error) {
            console.error('Interpretation failed:', error);
        } finally {
            setIsInterpreting(false);
        }
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col my-2">
            {/* Header - Clickable Toggle */}
            <div className="flex items-center">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex-1 px-3 py-1 border-b border-slate-700 text-left transition-opacity hover:opacity-90 focus:outline-none flex justify-between items-center"
                    style={{ backgroundColor: headerBgColor }}
                >
                    <span className="text-sm font-bold flex items-center gap-2" style={{ color: '#eeffff' }}>
                        {card.type === 'ai' && <Sparkles className="w-3 h-3" />}
                        {card.source}
                    </span>
                    <span
                        className="text-xs"
                        style={{ color: '#eeffff', opacity: 0.7 }}
                    >
                        {timestamp}
                    </span>
                </button>

                {/* AI Interpret Button */}
                {isFirstLook && onInterpretWithAi && (
                    <button
                        onClick={handleInterpret}
                        disabled={!isConfigured() || isInterpreting}
                        className="px-3 py-1 border-b border-l border-slate-700 hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                        style={{ backgroundColor: headerBgColor }}
                        title={!isConfigured() ? 'Configure AI in Settings to use this feature' : 'Interpret with AI'}
                    >
                        <Sparkles className="w-4 h-4" style={{ color: '#eeffff' }} />
                        {isInterpreting && <span className="text-xs" style={{ color: '#eeffff' }}>...</span>}
                    </button>
                )}
            </div>

            {/* Content - Collapsible */}
            <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                    maxHeight: isExpanded ? '1000px' : '0px',
                    opacity: isExpanded ? 1 : 0,
                }}
            >
                <div className="px-2 py-2 text-sm text-slate-400 whitespace-pre-wrap">
                    {/* AI Content Label */}
                    {card.type === 'ai' && (
                        <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">First Pass Content</div>
                    )}

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
