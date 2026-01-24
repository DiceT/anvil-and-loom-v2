import { create } from 'zustand'

interface DifficultyState {
    targetNumber: number
    isEnabled: boolean
    setTargetNumber: (tn: number) => void
    toggleEnabled: () => void
    setIsEnabled: (enabled: boolean) => void
}

export const useDifficultyStore = create<DifficultyState>((set) => ({
    targetNumber: 15,
    isEnabled: false,
    setTargetNumber: (tn) => set({ targetNumber: tn }),
    toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),
    setIsEnabled: (enabled) => set({ isEnabled: enabled }),
}))
