/**
 * Thread Interpreter Service
 * 
 * Orchestrates the AI interpretation of a Thread.
 */

import { Thread, ThreadAiInterpretation } from '../../types/thread';
import { callAi } from './aiClient';
import { buildInterpretationPrompt } from './promptBuilder';
import { PERSONA_DEFAULTS, getPersonaDefault } from './personaDefaults';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { EffectivePersona, GmPersonaId } from '../../types/ai';

export async function interpretThread(thread: Thread): Promise<ThreadAiInterpretation> {
    const settings = useSettingsStore.getState().settings;
    const aiConfig = settings.ai;

    if (!aiConfig.apiKey) {
        throw new Error('AI API Key not configured');
    }

    // Determine effective persona
    // In a real app, this might merge overrides from the session or thread
    const activePersonaId = (aiConfig.activePersonaId as GmPersonaId) || 'trickster';
    const defaultPersona = getPersonaDefault(activePersonaId);

    const effectivePersona: EffectivePersona = {
        id: activePersonaId,
        name: defaultPersona.defaultName,
        instructions: defaultPersona.defaultInstructions,
        // userInstructions could be merged here
    };

    const messages = buildInterpretationPrompt(
        thread.content || thread.summary,
        thread.summary,
        effectivePersona
    );

    const response = await callAi(
        aiConfig.uri || 'https://api.openai.com/v1/chat/completions',
        aiConfig.apiKey,
        aiConfig.model || 'gpt-4o-mini',
        messages
    );

    return {
        id: `interp_${Date.now()}`,
        personaId: effectivePersona.id,
        personaName: effectivePersona.name,
        content: response.content,
        timestamp: new Date().toISOString(),
        status: 'pending',
    };
}
