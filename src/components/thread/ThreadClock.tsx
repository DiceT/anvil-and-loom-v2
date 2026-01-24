import React from 'react';
import { Thread, ThreadClock as ClockModel, ThreadTrack as TrackModel } from '../../types/thread';
import { Clock, TrendingUp, Plus, Minus, Settings } from 'lucide-react';

interface ThreadClockProps {
    thread: Thread;
    onUpdate?: (updates: { clock?: Partial<ClockModel>; track?: Partial<TrackModel> }) => void;
}

export function ThreadClock({ thread, onUpdate }: ThreadClockProps) {
    const clock = thread.clock;
    const track = thread.track;

    if (!clock && !track) return null;

    // --- Clock Logic ---
    const handleClockSegmentClick = (index: number) => {
        if (!clock || !onUpdate) return;
        let newFilled = index + 1;
        if (newFilled === clock.filled) newFilled = index;
        onUpdate({ clock: { ...clock, filled: Math.max(0, Math.min(newFilled, clock.segments)) } });
    };

    const changeClockSegments = (delta: number) => {
        if (!clock || !onUpdate) return;
        const newSegments = Math.max(4, Math.min(12, clock.segments + delta));
        // Clamp filled to new segments
        const newFilled = Math.min(clock.filled, newSegments);
        // Persist isEditing: true to keep menu open
        onUpdate({ clock: { ...clock, segments: newSegments, filled: newFilled, isEditing: true } });
    };

    // Toggle needs to write to the store/document, not local state
    const toggleClockEditing = () => {
        if (!clock || !onUpdate) return;
        onUpdate({ clock: { ...clock, isEditing: !clock.isEditing } });
    };

    // --- Track Logic ---
    // Ironsworn Progress Track: 10 boxes, 4 ticks per box = 40 ticks total.
    const TOTAL_TICKS = 40;

    const getTicksPerMark = (difficulty: string = 'troublesome'): number => {
        switch (difficulty) {
            case 'troublesome': return 12; // 3 boxes
            case 'dangerous': return 8;    // 2 boxes
            case 'formidable': return 4;   // 1 box
            case 'extreme': return 2;      // 0.5 box
            case 'epic': return 1;         // 0.25 box
            default: return 4;
        }
    };

    const handleMarkProgress = () => {
        if (!track || !onUpdate) return;
        const ticks = getTicksPerMark(track.difficulty || 'troublesome');
        const currentTicks = track.filled; // Assumes filled is 0-40
        onUpdate({ track: { ...track, filled: Math.min(TOTAL_TICKS, currentTicks + ticks) } });
    };

    const handleClearProgress = () => {
        if (!track || !onUpdate) return;
        const ticks = getTicksPerMark(track.difficulty || 'troublesome');
        onUpdate({ track: { ...track, filled: Math.max(0, track.filled - ticks) } });
    };

    const handleSetDifficulty = (diff: TrackModel['difficulty']) => {
        if (!track || !onUpdate || !diff) return;
        onUpdate({ track: { ...track, difficulty: diff } });
    };

    // Manual box click: cycle ticks in that box (0 -> 1 -> 2 -> 3 -> 4 -> 0)
    // This allows fine-tuning.
    const handleBoxClick = (boxIndex: number) => {
        if (!track || !onUpdate) return;

        // Calculate ticks in this box
        const currentTotal = track.filled;
        const boxStart = boxIndex * 4;

        // Ticks currently in this box
        const ticksInBox = Math.max(0, Math.min(4, currentTotal - boxStart));

        // Cycle: if 4, go to 0. Else +1.
        const newTicksInBox = (ticksInBox === 4) ? 0 : ticksInBox + 1;

        // When manually editing a box, we assume previous boxes are full.
        // So newTotal = (boxIndex * 4) + newTicksInBox.

        const newTotal = (boxIndex * 4) + newTicksInBox;
        onUpdate({ track: { ...track, filled: newTotal } });
    };

    // --- Renderers ---

    if (clock) {
        return (
            <div className="px-3 py-3 border-t border-slate-700 bg-slate-800 flex items-start gap-4 group">
                {/* SVG Circular Clock */}
                <div className="relative shrink-0">
                    <ClockRenderer
                        segments={clock.segments}
                        filled={clock.filled}
                        onClick={onUpdate ? handleClockSegmentClick : undefined}
                        size={72}
                    />
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-purple-200 leading-tight mb-1">{clock.name}</div>
                        {onUpdate && (
                            <button
                                onClick={toggleClockEditing}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleClockEditing(); }}
                                className={`
                                    p-1 rounded transition-colors
                                    ${clock.isEditing ? 'text-purple-400 bg-slate-700' : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300 opacity-0 group-hover:opacity-100'}
                                `}
                            >
                                <Settings className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{clock.filled} / {clock.segments}</span>
                    </div>

                    {clock.isEditing && (
                        <div className="mt-2 flex items-center gap-2 text-xs bg-slate-900/50 p-1.5 rounded animate-in fade-in slide-in-from-top-1">
                            <span className="text-slate-400">Segments:</span>
                            <button
                                onClick={() => changeClockSegments(-2)}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); changeClockSegments(-2); }}
                                disabled={clock.segments <= 4}
                                className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-50"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-4 text-center font-mono">{clock.segments}</span>
                            <button
                                onClick={() => changeClockSegments(2)}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); changeClockSegments(2); }}
                                disabled={clock.segments >= 12}
                                className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-50"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (track) {
        const difficulties: TrackModel['difficulty'][] = ['troublesome', 'dangerous', 'formidable', 'extreme', 'epic'];

        return (
            <div className="px-3 py-3 border-t border-slate-700 bg-slate-800 flex flex-col gap-2">
                {/* Row 1: Title */}
                <div className="flex items-center gap-2 min-w-0">
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-sm text-emerald-200 font-bold truncate">
                        {track.name}
                    </div>
                </div>

                {/* Row 2: Controls (Actions + Tabs) */}
                <div className="flex items-center gap-3 h-6">
                    {/* Actions (+/-) */}
                    {onUpdate && (
                        <div className="flex items-center gap-1 shrink-0 bg-slate-700/50 rounded-sm p-0.5">
                            <button
                                onClick={handleMarkProgress}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleMarkProgress(); }}
                                className="p-1 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded transition-colors"
                                title="Mark Progress"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                            <div className="w-px h-3 bg-slate-600/50" /> {/* Divider */}
                            <button
                                onClick={handleClearProgress}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleClearProgress(); }}
                                className="p-1 hover:bg-red-900/50 hover:text-red-400 text-slate-500 rounded transition-colors"
                                title="Undo Progress"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Difficulty Cycler (Right Aligned) */}
                    {onUpdate && (
                        <div className="flex ml-auto">
                            <button
                                onClick={() => {
                                    if (!track || !onUpdate) return;
                                    const current = track.difficulty || 'troublesome';
                                    const idx = difficulties.indexOf(current);
                                    const next = difficulties[(idx + 1) % difficulties.length];
                                    handleSetDifficulty(next);
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!track || !onUpdate) return;
                                    const current = track.difficulty || 'troublesome';
                                    const idx = difficulties.indexOf(current);
                                    const next = difficulties[(idx + 1) % difficulties.length];
                                    handleSetDifficulty(next);
                                }}
                                className="px-2 py-0.5 text-[0.6rem] uppercase tracking-wider font-bold rounded-sm border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 shadow-sm hover:bg-emerald-900/60 hover:text-emerald-200 transition-colors"
                                title="Click to cycle difficulty"
                            >
                                {(track.difficulty || 'troublesome').toUpperCase()}
                            </button>
                        </div>
                    )}
                </div>

                {/* Row 3: Track Renderer (10 Boxes) */}
                <div className="flex gap-1 h-5 w-full mt-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                        // Calculate ticks in this box
                        const boxStart = i * 4;
                        const ticks = Math.max(0, Math.min(4, track.filled - boxStart));

                        return (
                            <button
                                key={i}
                                onMouseDown={(e) => {
                                    // Fine tuning: cycle ticks in this box
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleBoxClick(i);
                                }}
                                disabled={!onUpdate}
                                className={`
                                    flex-1 border border-slate-600 bg-slate-900/50 rounded-sm relative overflow-hidden group
                                    ${onUpdate ? 'cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800' : 'cursor-default'}
                                `}
                            >
                                <TickRenderer ticks={ticks} />
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
}

// --- Renderers ---

function TickRenderer({ ticks }: { ticks: number }) {
    if (ticks === 0) return null;
    if (ticks >= 4) return <div className="absolute inset-0 bg-emerald-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />;

    // Ironsworn style: 1=\ 2=X 3=* (or just use quadrants/lines)
    const strokeClass = "stroke-emerald-500 stroke-[2px]";

    return (
        <svg viewBox="0 0 10 10" className="absolute inset-0 w-full h-full p-[2px]">
            {ticks >= 1 && <line x1="1" y1="1" x2="9" y2="9" className={strokeClass} />}
            {ticks >= 2 && <line x1="9" y1="1" x2="1" y2="9" className={strokeClass} />}
            {ticks >= 3 && <line x1="5" y1="0" x2="5" y2="10" className={strokeClass} />}
        </svg>
    );
}

interface ClockRendererProps {
    segments: number;
    filled: number;
    onClick?: (index: number) => void;
    size?: number;
}

function ClockRenderer({ segments, filled, onClick, size = 48 }: ClockRendererProps) {
    const center = size / 2;
    const radius = size / 2 - 1; // 1px padding

    const makeSlicePath = (index: number, total: number) => {
        const startAngle = (index * 360) / total;
        const endAngle = ((index + 1) * 360) / total;

        // Convert to radians, subtract 90deg to start at 12 o'clock
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        return `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 0,1 ${x2},${y2} Z`;
    };

    return (
        <svg width={size} height={size} className="overflow-visible drop-shadow-lg">
            <circle cx={center} cy={center} r={radius} fill="#1e293b" stroke="#334155" strokeWidth="1" />

            {Array.from({ length: segments }).map((_, i) => {
                const isFilled = i < filled;
                return (
                    <path
                        key={i}
                        d={makeSlicePath(i, segments)}
                        fill={isFilled ? '#a855f7' : 'transparent'}
                        stroke="#0f172a"
                        strokeWidth="2"
                        className={`transition-colors duration-200 ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
                        onMouseDown={(e) => {
                            // Prevent ProseMirror from stealing focus/selection
                            e.preventDefault();
                            e.stopPropagation();
                            onClick?.(i);
                        }}
                    />
                );
            })}
        </svg>
    );
}
