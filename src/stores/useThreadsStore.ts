import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Thread } from '../core/results/types';

interface ThreadsStore {
  threads: Thread[];
  addThread: (thread: Thread) => void;
  clearThreads: () => void;
  loadThreads: (threads: Thread[]) => void;

  // Backwards-compatible accessors using older "cards" naming
  cards: Thread[];
  addCard: (card: Thread) => void;
  clearCards: () => void;
  loadCards: (cards: Thread[]) => void;
}

export const useThreadsStore = create<ThreadsStore>()(
  persist(
    (set, get) => ({
      threads: [],

      addThread: (thread) =>
        set((state) => ({
          threads: [...state.threads, thread],
        })),

      clearThreads: () =>
        set({ threads: [] }),

      loadThreads: (threads) =>
        set({ threads }),

      // Legacy card-based API, backed by threads
      get cards() {
        return get().threads;
      },

      addCard: (card) => get().addThread(card),

      clearCards: () => get().clearThreads(),

      loadCards: (cards) => get().loadThreads(cards),
    }),
    {
      name: 'anvil-loom-thread-history',
    }
  )
);
