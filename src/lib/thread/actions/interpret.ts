import { Sparkles } from 'lucide-react';
import { ThreadAction } from './types';
import { createThread } from '../../../types/thread';

export const interpretAction: ThreadAction = {
    id: 'interpret',
    label: 'Interpret',
    icon: Sparkles,
    shortcut: 'I',
    description: 'Ask AI to interpret this result',

    isAvailable: (thread, analysis, context) => {
        return analysis.canInterpret;
    },

    isEnabled: (thread, analysis, context) => {
        return context.aiConfigured;
    },

    execute: async (thread, context) => {
        try {
            // Dynamically import to avoid circular deps if any, or just standard import
            const { interpretThread } = await import('../../../core/ai/threadInterpreter');
            const interpretation = await interpretThread(thread);

            // Create interpretation Thread
            const interpretationThread = createThread({
                type: 'ai_text',
                source: 'ai',
                intent: 'consequence',
                header: `Interpretation: ${interpretation.personaName}`,
                summary: interpretation.content,
                parentThreadId: thread.id,
                // createdBy is defaulted to 'system' in createThread, override if needed?
                // Actually createThread defaults createdBy to 'system', but here it is AI.
            });
            // Override createdBy
            interpretationThread.createdBy = 'ai';

            return [interpretationThread];
        } catch (error) {
            console.error("Interpretation failed", error);
            return [];
        }
    },
};
