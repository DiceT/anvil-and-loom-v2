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

            // Parse the interpretation content
            // Expected format:
            // **Content:** ...
            // **Result:** ...
            const text = interpretation.content;
            let content = '';
            let result = text; // Default to full text if parsing fails

            // Simple parser for standard format
            // Simple parser for standard format
            // Matches "**Content:**" or "Content:" keys
            const contentMatch = text.match(/(?:\*\*|## |^)?Content:(?:\*\*)?\s*([\s\S]*?)(?=(?:\*\*|## |^)?Result:|$)/i);
            const resultMatch = text.match(/(?:\*\*|## |^)?Result:(?:\*\*)?\s*([\s\S]*)/i);

            if (contentMatch) {
                content = contentMatch[1].trim();
            }
            if (resultMatch) {
                result = resultMatch[1].trim();
            }

            // Fallback if parsing didn't split well but we have text
            if (!content && !resultMatch) {
                result = text;
            }

            // Create interpretation Thread
            const interpretationThread = createThread({
                type: 'ai_text',
                source: 'ai',
                intent: 'consequence',
                header: `Interpret: ${interpretation.personaName}`, // User Request: "Interpret: GM Persona Name"
                summary: result,       // Result section goes to summary
                result: result,        // Legacy compatibility: Populate result with summary text
                content: content,      // Content section goes to content
                parentThreadId: thread.id,
            } as any);
            // Override createdBy
            interpretationThread.createdBy = 'ai';

            // Persist the interpretation record on the thread itself (for history/context)
            // Note: The caller (ThreadEngine) usually handles adding the new thread, 
            // but we might want to update the original thread's metadata too if we were modifying it.
            // But here we are returning a NEW thread card as per the action contract.

            return [interpretationThread];
        } catch (error) {
            console.error("Interpretation failed", error);
            return [];
        }
    },
};
