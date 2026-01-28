/**
 * Thread Interpreter Service
 * 
 * Orchestrates the AI interpretation of a Thread.
 */

import { Thread, ThreadAiInterpretation } from '../../types/thread';
import { callAi } from './aiClient';
import { buildInterpretationPrompt } from './promptBuilder';
import { getPersonaDefault } from './personaDefaults';
import { useAiStore } from '../../stores/useAiStore';
import { EffectivePersona, GmPersonaId } from '../../types/ai';

export async function interpretThread(thread: Thread): Promise<ThreadAiInterpretation> {
    const aiConfig = useAiStore.getState().settings;

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

    // Get the latest accepted interpretation to use as context
    const latestInterpretation = thread.aiInterpretations
        ?.filter(i => i.status === 'accepted')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    // Format content as "Header | Result" if possible, otherwise use summary
    // This assumes thread.summary or content contains the table result
    const messages = buildInterpretationPrompt(
        thread.content || thread.summary,
        thread.summary,
        effectivePersona,
        latestInterpretation?.content
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
