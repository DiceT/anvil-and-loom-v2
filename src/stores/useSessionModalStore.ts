import { create } from 'zustand';

type SessionModalType = 'clock' | 'track' | null;

interface SessionModalState {
    activeModal: SessionModalType;
    openClockModal: () => void;
    openTrackModal: () => void;
    closeModal: () => void;
}

export const useSessionModalStore = create<SessionModalState>((set) => ({
    activeModal: null,
    openClockModal: () => set({ activeModal: 'clock' }),
    openTrackModal: () => set({ activeModal: 'track' }),
    closeModal: () => set({ activeModal: null }),
}));
