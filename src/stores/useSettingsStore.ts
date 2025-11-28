import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    GlobalSettings,
    DiceSettings,
    EditorSettings,
    defaultDiceSettings,
    defaultEditorSettings
} from '../types/settings';

interface SettingsStore {
    settings: GlobalSettings;

    // Actions
    updateDiceSettings: (partial: Partial<DiceSettings>) => void;
    updateEditorSettings: (partial: Partial<EditorSettings>) => void;
    resetDiceSettings: () => void;
    resetEditorSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            settings: {
                dice: defaultDiceSettings,
                editor: defaultEditorSettings,
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
        }),
        {
            name: 'anvil-loom-settings',
        }
    )
);
