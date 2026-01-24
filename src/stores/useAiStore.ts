import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    AiSettings,
    defaultAiSettings,
    GmPersonaId,
    GmPersonaUserState,
    EffectivePersona,
} from '../types/ai';
import { getPersonaDefault } from '../core/ai/personaDefaults';

interface AiStore {
    settings: AiSettings;

    // Connection settings
    updateConnectionSettings: (model: string, uri: string, apiKey: string) => void;

    // Persona management
    setActivePersona: (personaId: GmPersonaId) => void;
    updatePersonaName: (personaId: GmPersonaId, name: string) => void;
    updatePersonaInstructions: (personaId: GmPersonaId, instructions: string) => void;

    // Art Style
    updateArtStyleName: (name: string) => void;
    updateArtStyleInstructions: (instructions: string) => void;

    // Get effective persona (with overrides applied)
    getEffectivePersona: (personaId: GmPersonaId) => EffectivePersona;

    // Validation
    isConfigured: () => boolean;
}

export const useAiStore = create<AiStore>()(
    persist(
        (set, get) => ({
            settings: defaultAiSettings,

            updateConnectionSettings: (model, uri, apiKey) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        model,
                        uri,
                        apiKey,
                    },
                })),

            setActivePersona: (personaId) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        activePersonaId: personaId,
                    },
                })),

            updatePersonaName: (personaId, name) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        personaState: {
                            ...state.settings.personaState,
                            [personaId]: {
                                ...state.settings.personaState[personaId],
                                nameOverride: name,
                            },
                        },
                    },
                })),

            updatePersonaInstructions: (personaId, instructions) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        personaState: {
                            ...state.settings.personaState,
                            [personaId]: {
                                ...state.settings.personaState[personaId],
                                instructionsOverride: instructions,
                            },
                        },
                    },
                })),

            updateArtStyleName: (name) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        artStyle: {
                            ...state.settings.artStyle,
                            name,
                        },
                    },
                })),

            updateArtStyleInstructions: (instructions) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        artStyle: {
                            ...state.settings.artStyle,
                            instructions,
                        },
                    },
                })),

            getEffectivePersona: (personaId) => {
                const { settings } = get();
                const personaDefault = getPersonaDefault(personaId);
                const userState = settings.personaState[personaId] || {};

                return {
                    id: personaId,
                    name: userState.nameOverride || personaDefault.defaultName,
                    instructions: userState.instructionsOverride || personaDefault.defaultInstructions,
                };
            },

            isConfigured: () => {
                const { settings } = get();
                return !!(settings.model && settings.uri && settings.apiKey);
            },
        }),
        {
            name: 'anvil-loom-ai-settings',
        }
    )
);
