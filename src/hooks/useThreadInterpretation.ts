import { useCallback } from 'react';
import { useAiStore } from '../stores/useAiStore';
import { useEditorStore } from '../stores/useEditorStore';
import { callAi } from '../core/ai/aiClient';
import { buildFirstLookPrompt } from '../core/ai/promptBuilder';
import { parseInterpretation } from '../core/ai/responseParser';
import { ThreadModel, EntryDoc } from '../types/tapestry';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hook for interpreting threads with AI
 */
export function useThreadInterpretation() {
    const { settings, getEffectivePersona } = useAiStore();
    const { updateEntryContent, openEntries, activeEntryId } = useEditorStore();

    const interpretFirstLook = useCallback(
        async (thread: ThreadModel, panel: EntryDoc): Promise<void> => {
            // Validate AI configuration
            if (!settings.model || !settings.uri || !settings.apiKey) {
                throw new Error('AI is not configured. Please configure AI in Settings.');
            }

            // Get active persona
            const persona = getEffectivePersona(settings.activePersonaId);

            // Extract Place context from panel
            const placeName = panel.title;
            const aspects = (panel.frontmatter.aspects || [])
                .map(id => id); // TODO: Look up names
            const domains = (panel.frontmatter.domains || [])
                .map(id => id); // TODO: Look up names

            // Build prompt
            const messages = buildFirstLookPrompt(
                placeName,
                aspects,
                domains,
                thread.content || '',
                thread.summary,
                persona
            );

            // Call AI
            const response = await callAi(settings.uri, settings.apiKey, settings.model, messages);

            // Parse response
            const interpretation = parseInterpretation(response.content);

            // Create NEW AI Thread
            const aiThread: ThreadModel = {
                id: uuidv4(),
                type: 'ai',
                source: `Interpretation: ${persona.name}`,
                summary: interpretation.result,
                content: interpretation.content,
                payload: {
                    personaId: persona.id,
                    originalThreadId: thread.id
                },
                timestamp: new Date().toISOString()
            };

            // Find the original thread block and insert the new one after it
            const content = panel.content || '';
            const regex = /```result-card\n([\s\S]*?)\n```/g;
            let match;
            let insertIndex = -1;
            let matchLength = 0;

            while ((match = regex.exec(content)) !== null) {
                try {
                    const threadJson = JSON.parse(match[1]);
                    if (threadJson.id === thread.id) {
                        insertIndex = match.index;
                        matchLength = match[0].length;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (insertIndex !== -1) {
                const aiThreadBlock = `\n\n\`\`\`result-card\n${JSON.stringify(aiThread, null, 2)}\n\`\`\``;
                const updatedContent =
                    content.slice(0, insertIndex + matchLength) +
                    aiThreadBlock +
                    content.slice(insertIndex + matchLength);

                // Update panel content
                const activeEntry = openEntries.find(e => e.id === activeEntryId);
                if (activeEntry) {
                    updateEntryContent(activeEntry.id, updatedContent);
                }
            }
        },
        [settings, getEffectivePersona, updateEntryContent, openEntries, activeEntryId]
    );

    return {
        interpretFirstLook,
    };
}
