import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEditorStore } from './useEditorStore';

interface SessionStore {
    activeSessionId: string | null;
    startSession: (newSessionId: string) => void;
    endSession: () => void;
    isActiveSession: (id: string) => boolean;
}

export const useSessionStore = create<SessionStore>()(
    persist(
        (set, get) => ({
            activeSessionId: null,

            startSession: (newSessionId: string) => {
                set({ activeSessionId: newSessionId });
            },

            endSession: () => {
                set({ activeSessionId: null });
            },

            isActiveSession: (id: string) => {
                return get().activeSessionId === id;
            }
        }),
        {
            name: 'anvil-loom-session-store',
            version: 1,
        }
    )
);
