import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Thread } from '../types/thread';

interface ThreadsStore {
  threads: Thread[];
  addThread: (thread: Thread) => void;
  clearThreads: () => void;
  loadThreads: (threads: Thread[]) => void;
  updateThread: (id: string, updates: Partial<Thread>) => void;

  // Cleaned: Legacy 'cards' alias removed.
}

export const useThreadsStore = create<ThreadsStore>()(
  persist(
    (set) => ({
      threads: [],

      addThread: (thread) =>
        set((state) => ({
          threads: [...state.threads, thread],
        })),

      clearThreads: () =>
        set({ threads: [] }),

      loadThreads: (threads) =>
        set({ threads }),

      updateThread: (id, updates) => set((state) => {
        const newThreads = state.threads.map(t =>
          t.id === id ? { ...t, ...updates } : t
        );
        return {
          threads: newThreads
        };
      }),
    }),
    {
      name: 'anvil-loom-thread-history',
      version: 2, // Bump version to invalidate old legacy cache if needed
    }
  )
);
