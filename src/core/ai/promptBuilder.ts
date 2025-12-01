import { AiMessage } from './aiClient';
import { UNIVERSAL_GM_INSTRUCTIONS } from './personaDefaults';
import { EffectivePersona } from '../../types/ai';

/**
 * Build prompt messages for First Look interpretation
 */
export function buildFirstLookPrompt(
    placeName: string,
    aspects: string[],
    domains: string[],
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
    const taskPrompt = `# First Look Interpretation

You are interpreting a "First Look" at a Place in the game world.

**Place Name:** ${placeName}

**Aspects:** ${aspects.join(', ')}
**Domains:** ${domains.join(', ')}

**Oracle Results (Raw):**
${threadSummary}

**Roll Details:**
${threadContent}

---

Your task:
Interpret these oracle results into an evocative, in-world scene description.

- Weave together the Location, Manifestation, Atmosphere, and Discovery elements into a coherent narrative.
- Follow your persona's style and the universal GM instructions.
- Provide your interpretation in the standard two-section format:
  - **Content:** Your exploratory first pass
  - **Result:** Your final, refined interpretation

Do not include any meta-commentary, dice numbers, or table names in your narration.`;

    messages.push({
        role: 'user',
        content: taskPrompt,
    });

    return messages;
}
