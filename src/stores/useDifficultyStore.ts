import { create } from 'zustand'

interface DifficultyState {
    targetNumber: number
    tierDifferential: number
    actionBonus: number
    isEnabled: boolean

    setTargetNumber: (tn: number) => void
    setTierDifferential: (diff: number) => void
    setActionBonus: (bonus: number) => void
    toggleEnabled: () => void
    setIsEnabled: (enabled: boolean) => void
}

export const useDifficultyStore = create<DifficultyState>((set) => ({
    targetNumber: 15, // Default DC
    tierDifferential: -3, // Default for DC-3 (Success with Consequence = DC - 3)
    actionBonus: 3, // Default Action Bonus
    isEnabled: false,

    setTargetNumber: (tn) => set({ targetNumber: tn }),
    setTierDifferential: (diff) => set({ tierDifferential: diff }),
    setActionBonus: (bonus) => set({ actionBonus: bonus }),
    toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),
    setIsEnabled: (enabled) => set({ isEnabled: enabled }),
}))
