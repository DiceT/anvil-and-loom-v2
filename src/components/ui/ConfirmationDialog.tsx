import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmationDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
}: ConfirmationDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-canvas-panel rounded-lg shadow-2xl border border-border w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sapphire/10 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-sapphire" />
                        </div>
                        <h2 className="text-xl font-semibold text-type-primary">{title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1.5 hover:bg-canvas-surface rounded-md text-type-tertiary hover:text-type-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-type-secondary">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-canvas-surface hover:bg-border text-type-primary rounded-md transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-sapphire hover:opacity-90 text-canvas rounded-md transition-colors font-medium"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
