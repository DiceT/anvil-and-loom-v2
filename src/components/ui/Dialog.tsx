import React from 'react';

export interface DialogProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
    confirmText: string;
    confirmDisabled?: boolean;
    confirmDanger?: boolean;
}

export function Dialog({ title, children, onClose, onConfirm, confirmText, confirmDisabled, confirmDanger }: DialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-canvas-panel rounded-lg shadow-2xl border border-border w-full max-w-md mx-4">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-type-primary">{title}</h2>
                </div>
                <div className="p-6">
                    {children}
                </div>
                <div className="flex gap-3 p-6 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-canvas-surface hover:bg-border text-type-primary rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={confirmDisabled}
                        className={`flex-1 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmDanger
                            ? 'bg-error hover:bg-error/80 text-type-primary'
                            : 'bg-sapphire hover:opacity-90 text-canvas'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
