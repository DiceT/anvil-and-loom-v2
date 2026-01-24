import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Thread } from '../core/results/types';

interface ThreadsStore {
  threads: Thread[];
  addThread: (thread: Thread) => void;
  clearThreads: () => void;
  loadThreads: (threads: Thread[]) => void;
  updateThread: (id: string, updates: Partial<Thread>) => void;

  // Backwards-compatible accessors using older "cards" naming
  cards: Thread[];
  addCard: (card: Thread) => void;
  clearCards: () => void;
  loadCards: (cards: Thread[]) => void;
}

export const useThreadsStore = create<ThreadsStore>()(
  persist(
    (set) => ({
      threads: [],

      addThread: (thread) =>
        set((state) => ({
          threads: [...state.threads, thread],
          cards: [...state.threads, thread],
        })),

      clearThreads: () =>
        set({ threads: [], cards: [] }),

      loadThreads: (threads) =>
        set({ threads, cards: threads }),

      updateThread: (id, updates) => set((state) => {
        const newThreads = state.threads.map(t =>
          t.id === id ? { ...t, ...updates } : t
        );
        return {
          threads: newThreads,
          cards: newThreads
        };
      }),

      // Legacy card-based API, backed by threads
      cards: [],

      addCard: (card) => set((state) => ({
        threads: [...state.threads, card],
        cards: [...state.threads, card],
      })),

      clearCards: () => set({ threads: [], cards: [] }),

      loadCards: (cards) => set({ threads: cards, cards }),
    }),
    {
      name: 'anvil-loom-thread-history',
      version: 1,
    }
  )
);
