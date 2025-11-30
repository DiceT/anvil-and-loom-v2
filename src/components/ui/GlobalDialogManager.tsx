import React from 'react';
import { useDialogStore } from '../../stores/useDialogStore';
import { ConfirmationDialog } from './ConfirmationDialog';

export function GlobalDialogManager() {
    const { isOpen, title, message, confirmText, cancelText, handleConfirm, handleCancel } = useDialogStore();

    return (
        <ConfirmationDialog
            isOpen={isOpen}
            title={title}
            message={message}
            confirmText={confirmText}
            cancelText={cancelText}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );
}
