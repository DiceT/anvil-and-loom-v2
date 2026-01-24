import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    MacroSlot,
    createEmptyMacroBar,
    createEmptySlot,
    SLOTS_PER_ROW,
    TOTAL_ROWS,
} from '../types/macro'

interface MacroState {
    // ─── State ───
    slots: MacroSlot[]
    visibleRow: number            // 0-3

    // ─── Row Navigation ───
    nextRow: () => void
    prevRow: () => void
    setRow: (row: number) => void

    // ─── Slot Management ───
    setSlot: (index: number, slot: MacroSlot) => void
    clearSlot: (index: number) => void
    swapSlots: (indexA: number, indexB: number) => void
    moveSlot: (fromIndex: number, toIndex: number) => void

    // ─── Queries ───
    getVisibleSlots: () => MacroSlot[]
    getSlot: (index: number) => MacroSlot | undefined

    // ─── Persistence ───
    importMacros: (slots: MacroSlot[]) => void
    exportMacros: () => MacroSlot[]
    resetMacros: () => void
}

export const useMacroStore = create<MacroState>()(
    persist(
        (set, get) => ({
            // ─── Initial State ───
            slots: createEmptyMacroBar(),
            visibleRow: 0,

            // ─── Row Navigation ───
            nextRow: () => {
                set(state => ({
                    visibleRow: (state.visibleRow + 1) % TOTAL_ROWS
                }))
            },

            prevRow: () => {
                set(state => ({
                    visibleRow: (state.visibleRow - 1 + TOTAL_ROWS) % TOTAL_ROWS
                }))
            },

            setRow: (row) => {
                if (row >= 0 && row < TOTAL_ROWS) {
                    set({ visibleRow: row })
                }
            },

            // ─── Slot Management ───
            setSlot: (index, slot) => {
                set(state => ({
                    slots: state.slots.map((s, i) =>
                        i === index ? { ...slot, index } : s
                    )
                }))
            },

            clearSlot: (index) => {
                set(state => ({
                    slots: state.slots.map((s, i) =>
                        i === index ? createEmptySlot(index) : s
                    )
                }))
            },

            swapSlots: (indexA, indexB) => {
                set(state => {
                    const newSlots = [...state.slots]
                    const slotA = { ...newSlots[indexA], index: indexB }
                    const slotB = { ...newSlots[indexB], index: indexA }
                    newSlots[indexA] = slotB
                    newSlots[indexB] = slotA
                    return { slots: newSlots }
                })
            },

            moveSlot: (fromIndex, toIndex) => {
                set(state => {
                    const newSlots = [...state.slots]
                    const movingSlot = { ...newSlots[fromIndex], index: toIndex }
                    const displacedSlot = { ...newSlots[toIndex], index: fromIndex }
                    newSlots[toIndex] = movingSlot
                    newSlots[fromIndex] = displacedSlot
                    return { slots: newSlots }
                })
            },

            // ─── Queries ───
            getVisibleSlots: () => {
                const { slots, visibleRow } = get()
                const start = visibleRow * SLOTS_PER_ROW
                return slots.slice(start, start + SLOTS_PER_ROW)
            },

            getSlot: (index) => get().slots[index],

            // ─── Persistence ───
            importMacros: (slots) => {
                set({ slots })
            },

            exportMacros: () => get().slots,

            resetMacros: () => {
                set({ slots: createEmptyMacroBar(), visibleRow: 0 })
            },
        }),
        {
            name: 'anvil-loom-macros',
            // Store per-tapestry by including tapestry ID in key
            // This will be handled by a wrapper that switches storage keys
        }
    )
)
