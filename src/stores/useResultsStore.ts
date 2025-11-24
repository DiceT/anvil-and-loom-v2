import { create } from 'zustand';
import { ResultCard } from '../core/results/types';

interface ResultsStore {
  cards: ResultCard[];
  addCard: (card: ResultCard) => void;
  clearCards: () => void;
  loadCards: (cards: ResultCard[]) => void;
}

export const useResultsStore = create<ResultsStore>((set) => ({
  cards: [],

  addCard: (card) =>
    set((state) => ({
      cards: [...state.cards, card],
    })),

  clearCards: () =>
    set({ cards: [] }),

  loadCards: (cards) =>
    set({ cards }),
}));
