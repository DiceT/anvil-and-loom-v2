
import React from 'react';
import { useStitchStore } from '../../stores/useStitchStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { ArrowRight, ArrowLeft, Link as LinkIcon, MapPin } from 'lucide-react';

export function Stitchboard() {
    const { activeEntryId, openEntries } = useEditorStore();
    const { getOutgoing, getIncoming, resolvePanel } = useStitchStore();
    const { openEntry } = useEditorStore();

    const activeEntry = openEntries.find(e => e.id === activeEntryId);

    if (!activeEntry) {
        return (
            <div className="p-4 text-slate-500 text-center italic">
                No active panel
            </div>
        );
    }

    const outgoing = getOutgoing(activeEntry.id);
    const incoming = getIncoming(activeEntry.title);

    const handleNavigate = async (title: string) => {
        const resolved = resolvePanel(title);
        if (resolved) {
            await openEntry(resolved.path);
        }
    };



    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-200 overflow-y-auto">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-400">
                        <LinkIcon size={20} />
                        Stitchboard
                    </h2>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]">{activeEntry.title}</p>
                </div>
                <button
                    onClick={() => {
                        const tapestryId = useEditorStore.getState().openEntries[0]?.id; // Hacky way to get ID if needed, but better to use activeTapestryId from store
                        // Actually we need activeTapestryId from useTapestryStore
                        import('../../stores/useTapestryStore').then(({ useTapestryStore }) => {
                            const id = useTapestryStore.getState().activeTapestryId;
                            if (id) {
                                useStitchStore.getState().buildIndex(id);
                            }
                        });
                    }}
                    className="p-1.5 text-slate-500 hover:text-purple-400 hover:bg-slate-800 rounded transition-colors"
                    title="Rebuild Index"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                    </svg>
                </button>
            </div>

            {/* Outgoing Stitches */}
            <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                    <ArrowRight size={16} />
                    Stitches ({outgoing.length})
                </h3>

                {outgoing.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">No outgoing stitches</p>
                ) : (
                    <div className="space-y-2">
                        {outgoing.map(target => {
                            const isResolved = !!resolvePanel(target);
                            return (
                                <button
                                    key={target}
                                    onClick={() => handleNavigate(target)}
                                    disabled={!isResolved}
                                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between group ${isResolved
                                        ? 'hover:bg-slate-800 text-slate-300'
                                        : 'text-slate-600 cursor-not-allowed'
                                        }`}
                                >
                                    <span className={!isResolved ? 'line-through decoration-slate-700' : ''}>
                                        {target}
                                    </span>
                                    {!isResolved && <span className="text-[10px] text-slate-700">Missing</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Incoming Backstitches */}
            <div className="p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Backstitches ({incoming.length})
                </h3>

                {incoming.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">No backstitches</p>
                ) : (
                    <div className="space-y-4">
                        {incoming.map((ref, idx) => {
                            const isMapPin = ref.context.startsWith('📍');
                            return (
                                <div key={`${ref.sourceId}-${idx}`} className="bg-slate-800/50 rounded p-3 text-sm">
                                    <button
                                        onClick={() => handleNavigate(ref.sourceTitle)}
                                        className="font-medium text-purple-400 hover:text-purple-300 hover:underline mb-1 flex items-center gap-2"
                                    >
                                        {isMapPin && <MapPin size={14} className="text-orange-400" />}
                                        {ref.sourceTitle}
                                    </button>
                                    {!isMapPin && (
                                        <div className="text-xs text-slate-500 bg-slate-900/50 p-2 rounded border-l-2 border-slate-700 italic">
                                            "...{ref.context}..."
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
