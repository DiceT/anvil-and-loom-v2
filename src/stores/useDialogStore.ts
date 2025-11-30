import { create } from 'zustand';

interface DialogState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    resolve: ((value: boolean) => void) | null;

    confirm: (options: { title: string; message: string; confirmText?: string; cancelText?: string }) => Promise<boolean>;
    handleConfirm: () => void;
    handleCancel: () => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    resolve: null,

    confirm: ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
        return new Promise((resolve) => {
            set({
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                resolve,
            });
        });
    },

    handleConfirm: () => {
        const { resolve } = get();
        if (resolve) resolve(true);
        set({ isOpen: false, resolve: null });
    },

    handleCancel: () => {
        const { resolve } = get();
        if (resolve) resolve(false);
        set({ isOpen: false, resolve: null });
    },
}));
