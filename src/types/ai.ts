// AI Integration Type Definitions

/**
 * Available GM Persona identifiers
 */
export type GmPersonaId =
    | 'archivist'
    | 'cutthroat'
    | 'mystic'
    | 'trickster'
    | 'minimalist'
    | 'hearth_keeper'
    | 'dreadnought'
    | 'muse';

/**
 * Configuration for a GM Persona (defaults)
 */
export interface GmPersonaConfig {
    id: GmPersonaId;
    defaultName: string;
    defaultInstructions: string;
}

/**
 * User customizations for a specific persona
 */
export interface GmPersonaUserState {
    nameOverride?: string;
    instructionsOverride?: string;
}

/**
 * AI connection and persona settings
 */
export interface AiSettings {
    model: string;
    uri: string;
    apiKey: string;
    activePersonaId: GmPersonaId;
    personaState: Record<GmPersonaId, GmPersonaUserState>;
    artStyle: {
        name: string;
        instructions: string;
    };
}

/**
 * Default AI settings
 */
export const defaultAiSettings: AiSettings = {
    model: '',
    uri: '',
    apiKey: '',
    activePersonaId: 'archivist',
    personaState: {
        archivist: {},
        cutthroat: {},
        mystic: {},
        trickster: {},
        minimalist: {},
        hearth_keeper: {},
        dreadnought: {},
        muse: {},
    },
    artStyle: {
        name: '',
        instructions: '',
    },
};

/**
 * AI-generated interpretation of a thread
 */
export interface ThreadAiInterpretation {
    personaId: string;
    personaName: string;
    content: string;
    result: string;
    createdAt: string;
}

/**
 * Effective persona with merged overrides
 */
export interface EffectivePersona {
    id: GmPersonaId;
    name: string;
    instructions: string;
}
