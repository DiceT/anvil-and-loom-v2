import { AiMessage } from './aiClient';
import { UNIVERSAL_GM_INSTRUCTIONS } from './personaDefaults';
import { EffectivePersona } from '../../types/ai';

/**
 * Build prompt messages for thread interpretation
 */
export function buildInterpretationPrompt(
    threadContent: string,
    threadSummary: string,
    persona: EffectivePersona
): AiMessage[] {
    const messages: AiMessage[] = [];

    // 1. Universal GM instructions (system)
    messages.push({
        role: 'system',
        content: UNIVERSAL_GM_INSTRUCTIONS,
    });

    // 2. Persona instructions (system)
    messages.push({
        role: 'system',
        content: persona.instructions,
    });

    // 3. Task-specific request (user)
    const taskPrompt = `# Thread Interpretation

You are interpreting a Thread result from the game world.

**Thread Summary:**
${threadSummary}

**Roll Details:**
${threadContent}

---

Your task:
Interpret this thread result into an evocative, in-world scene description.

- Follow your persona's style and universal GM instructions.
- Provide your interpretation in standard two-section format:
  - **Content:** Your exploratory first pass
  - **Result:** Your final, refined interpretation

Do not include any meta-commentary, dice numbers, or table names in your narration.`;

    messages.push({
        role: 'user',
        content: taskPrompt,
    });

    return messages;
}
