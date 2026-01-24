import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    GlobalSettings,
    DiceSettings,
    EditorSettings,
    MechanicsSettings,
    defaultDiceSettings,
    defaultEditorSettings,
    defaultMechanicsSettings,
} from '../types/settings';

interface SettingsStore {
    settings: GlobalSettings;

    // Actions
    updateDiceSettings: (partial: Partial<DiceSettings>) => void;
    updateEditorSettings: (partial: Partial<EditorSettings>) => void;
    updateMechanicsSettings: (partial: Partial<MechanicsSettings>) => void;
    resetDiceSettings: () => void;
    resetEditorSettings: () => void;
    resetMechanicsSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            settings: {
                dice: defaultDiceSettings,
                editor: defaultEditorSettings,
                mechanics: defaultMechanicsSettings,
            },

            updateDiceSettings: (partial) => set((state) => ({
                settings: {
                    ...state.settings,
                    dice: { ...state.settings.dice, ...partial }
                }
            })),

            updateEditorSettings: (partial) => set((state) => ({
                settings: {
                    ...state.settings,
                    editor: { ...state.settings.editor, ...partial }
                }
            })),

            updateMechanicsSettings: (partial) => set((state) => ({
                settings: {
                    ...state.settings,
                    mechanics: { ...state.settings.mechanics, ...partial }
                }
            })),

            resetDiceSettings: () => set((state) => ({
                settings: {
                    ...state.settings,
                    dice: defaultDiceSettings
                }
            })),

            resetEditorSettings: () => set((state) => ({
                settings: {
                    ...state.settings,
                    editor: defaultEditorSettings
                }
            })),

            resetMechanicsSettings: () => set((state) => ({
                settings: {
                    ...state.settings,
                    mechanics: defaultMechanicsSettings
                }
            })),
        }),
        {
            name: 'anvil-loom-settings',
        }
    )
);
