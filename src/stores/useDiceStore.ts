import { create } from 'zustand';
import { MaterialPreset } from '../components/dice/DiceMaterials';

interface DiceSettings {
    diceColor: string;
    numberColor: string;
    material: MaterialPreset;
    surfaceType: 'felt' | 'wood' | 'metal';
    diceSet: 'chamfered' | 'rounded' | 'sharp' | 'stamped' | 'valkyrie';
}

interface DiceStore {
    settings: DiceSettings;
    rerollTrigger: number;
    setDiceColor: (color: string) => void;
    setNumberColor: (color: string) => void;
    setMaterial: (material: MaterialPreset) => void;
    setSurfaceType: (surface: 'felt' | 'wood' | 'metal') => void;
    setDiceSet: (set: 'chamfered' | 'rounded' | 'sharp' | 'stamped' | 'valkyrie') => void;
    triggerReroll: () => void;
}

export const useDiceStore = create<DiceStore>((set) => ({
    settings: {
        diceColor: '#8b5cf6',
        numberColor: '#ffffff',
        material: 'plastic',
        surfaceType: 'felt',
        diceSet: 'chamfered',
    },
    rerollTrigger: 0,
    setDiceColor: (color) => set((state) => ({
        settings: { ...state.settings, diceColor: color }
    })),
    setNumberColor: (color) => set((state) => ({
        settings: { ...state.settings, numberColor: color }
    })),
    setMaterial: (material) => set((state) => ({
        settings: { ...state.settings, material }
    })),
    setSurfaceType: (surface) => set((state) => ({
        settings: { ...state.settings, surfaceType: surface }
    })),
    setDiceSet: (set_) => set((state) => ({
        settings: { ...state.settings, diceSet: set_ }
    })),
    triggerReroll: () => set((state) => ({
        rerollTrigger: state.rerollTrigger + 1
    })),
}));
