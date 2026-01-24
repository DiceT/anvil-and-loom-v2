import React from 'react';
import { Thread } from '../../types/thread';

interface ThreadContentProps {
    thread: Thread;
    isExpanded: boolean;
}

export function ThreadContent({ thread, isExpanded }: ThreadContentProps) {
    return (
        <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
                maxHeight: isExpanded ? '1000px' : '0px',
                opacity: isExpanded ? 1 : 0,
            }}
        >
            <div className="px-2 py-2 text-sm text-slate-400 whitespace-pre-wrap rounded-b bg-slate-900/30">

                {/* Helper Metadata Breakdown */}
                {thread.meta?.dice && (
                    <div className="space-y-1 mb-2 pb-2 border-b border-slate-700/50">
                        {thread.meta.dice.expression && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">Expr:</span>
                                <span className="text-slate-300 font-mono">{thread.meta.dice.expression}</span>
                            </div>
                        )}

                        {thread.meta.dice.breakdown && (
                            <div>
                                <span className="text-slate-500 mr-2">Rolls:</span>
                                {thread.meta.dice.breakdown.map((roll, i) => (
                                    <span key={i} className={roll.kept ? 'font-bold text-slate-200' : 'text-slate-600'}>
                                        {roll.value}{i < thread.meta.dice!.breakdown.length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </div>
                        )}

                        {thread.meta.dice.total !== undefined && (
                            <div className="flex justify-between font-bold">
                                <span className="text-slate-500">Total:</span>
                                <span className="text-amber-400">{thread.meta.dice.total}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Regular Content / Description */}
                {thread.content && (
                    <div className="prose prose-invert prose-xs max-w-none text-slate-400">
                        {thread.content}
                    </div>
                )}

                {/* Weave Metadata */}
                {thread.meta?.weave && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs">
                        <span className="text-slate-500">Table: </span>
                        <span className="text-slate-300">{thread.meta.weave.tableName}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
