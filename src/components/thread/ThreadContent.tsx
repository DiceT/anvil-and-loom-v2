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
            <div className="px-2 py-2 text-sm text-type-secondary whitespace-pre-wrap rounded-b bg-canvas/30">

                {/* Helper Metadata Breakdown */}
                {thread.meta?.dice && (
                    <div className="space-y-1 mb-2 pb-2 border-b border-border/50">
                        {thread.meta.dice.expression && (
                            <div className="flex justify-between">
                                <span className="text-type-tertiary">Expr:</span>
                                <span className="text-type-secondary font-mono">{thread.meta.dice.expression}</span>
                            </div>
                        )}

                        {thread.meta.dice.breakdown && (
                            <div>
                                <span className="text-type-tertiary mr-2">Rolls:</span>
                                {thread.meta.dice.breakdown.map((roll, i) => (
                                    <span key={i} className={roll.kept ? 'font-bold text-type-primary' : 'text-type-tertiary'}>
                                        {roll.value}{i < thread.meta.dice!.breakdown.length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </div>
                        )}

                        {thread.meta.dice.total !== undefined && (
                            <div className="flex justify-between font-bold">
                                <span className="text-type-tertiary">Total:</span>
                                <span className="text-gold">{thread.meta.dice.total}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Regular Content / Description */}
                {thread.content && (
                    <div className="prose prose-invert prose-xs max-w-none text-type-secondary">
                        {thread.content}
                    </div>
                )}

                {/* Weave Metadata */}
                {thread.meta?.weave && (
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs">
                        <span className="text-type-tertiary">Table: </span>
                        <span className="text-type-secondary">{thread.meta.weave.tableName}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
