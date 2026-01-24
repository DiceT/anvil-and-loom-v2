/**
 * WeaveAIService - AI service for Weave table operations
 * 
 * Mirrors the-weave's AIService implementation.
 * Uses Anvil and Loom's AI settings (API key, endpoint, model) and GM Persona.
 * 
 * Key differences from the-weave:
 * - Uses useAiStore for configuration instead of localStorage
 * - Uses GM Persona instructions as system prompt
 */

import { useAiStore } from '../../stores/useAiStore';
import { callAi, type AiMessage } from '../ai/aiClient';

/**
 * Result of an AI table generation/fill
 */
export interface AIGenerateResult {
  rows: {
    floor: number;
    ceiling: number;
    result: string;
  }[];
}

/**
 * Result of an AI table review
 */
export interface AIReviewResult {
  issues: {
    type: 'tone' | 'consistency' | 'duplicate';
    message: string;
    rowIndex?: number;
  }[];
  suggestions: string[];
}

/**
 * WeaveAIService - Provides AI functionality for Weave tables
 * 
 * Matches the-weave's AIService interface:
 * - generateTable(name, description, rowCount)
 * - fillTable(name, description, existingRows, targetCount)
 * - reviewTable(name, description, rows)
 */
export class WeaveAIService {
  /**
   * Get AI settings from useAiStore
   */
  private getAISettings() {
    const { settings, getEffectivePersona, isConfigured } = useAiStore.getState();

    if (!isConfigured()) {
      throw new Error('AI is not configured. Please set up your API key, endpoint, and model in Settings.');
    }

    const persona = getEffectivePersona(settings.activePersonaId);

    return {
      uri: settings.uri,
      apiKey: settings.apiKey,
      model: settings.model,
      systemPrompt: persona.instructions || 'You are a creative assistant for tabletop RPG random table creation. Be concise and creative.',
    };
  }

  /**
   * Check if AI is configured
   */
  isConfigured(): boolean {
    const { isConfigured } = useAiStore.getState();
    return isConfigured();
  }

  /**
   * Generate a new table from a prompt
   * Matches the-weave's generateTable(name, description, rowCount)
   */
  async generateTable(
    name: string,
    description: string,
    rowCount: number
  ): Promise<AIGenerateResult> {
    const { uri, apiKey, model, systemPrompt } = this.getAISettings();

    const prompt = `Generate a random table for a tabletop RPG.

Topic: ${name}
Description: ${description}

Generate exactly ${rowCount} unique, creative entries.
Return as a simple numbered list, one entry per line:
1. First entry
2. Second entry
3. Third entry
...and so on.

Generate the entries now:`;

    const systemMessage: AiMessage = {
      role: 'system',
      content: systemPrompt,
    };

    const userMessage: AiMessage = {
      role: 'user',
      content: prompt,
    };

    const response = await callAi(uri, apiKey, model, [systemMessage, userMessage], {
      do_sample: true,
      temperature: 0.9,
    });
    return this.parseListResponse(response.content);
  }

  /**
   * Fill a table with more entries
   * Matches the-weave's fillTable(name, description, existingRows, targetCount)
   * 
   * @param name - Table name
   * @param description - Table description
   * @param existingRows - Array of existing result strings
   * @param targetCount - Total number of rows desired (not rows to add)
   */
  async fillTable(
    name: string,
    description: string,
    existingRows: string[],
    targetCount: number
  ): Promise<AIGenerateResult> {
    const { uri, apiKey, model, systemPrompt } = this.getAISettings();

    const needed = targetCount - existingRows.length;
    if (needed <= 0) {
      return { rows: [] };
    }

    let prompt: string;

    if (existingRows.length === 0) {
      // Empty table: generate from scratch
      prompt = `Generate a random table for a tabletop RPG.

Topic: ${name}
Description: ${description || 'A random table for tabletop RPG use'}

Generate exactly ${targetCount} unique, creative entries.
Return as a simple numbered list, one entry per line:
1. First entry
2. Second entry
3. Third entry
...and so on.

Generate the entries now:`;
    } else {
      // Table has entries: add more matching the style
      prompt = `Add more entries to this random table for a tabletop RPG.

Topic: ${name}
Description: ${description}

Existing entries:
${existingRows.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Generate ${needed} more unique entries that match the style and theme.
Return as a simple numbered list starting at ${existingRows.length + 1}:`;
    }

    const systemMessage: AiMessage = {
      role: 'system',
      content: systemPrompt,
    };

    const userMessage: AiMessage = {
      role: 'user',
      content: prompt,
    };

    const response = await callAi(uri, apiKey, model, [systemMessage, userMessage], {
      do_sample: true,
      temperature: 0.9,
    });
    return this.parseListResponse(response.content, existingRows.length);
  }

  /**
   * Review a table for quality, consistency, and duplicates
   * Matches the-weave's reviewTable(name, description, rows)
   */
  async reviewTable(
    name: string,
    description: string,
    rows: string[]
  ): Promise<AIReviewResult> {
    const { uri, apiKey, model, systemPrompt } = this.getAISettings();

    const prompt = `Review this random table for a tabletop RPG:

Table: ${name}
Description: ${description}

Entries:
${rows.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Check for:
1. Tone consistency - do all entries feel like they belong together?
2. Duplicate or very similar entries
3. Style consistency

Respond with a brief analysis listing any issues found and suggestions for improvement.`;

    const systemMessage: AiMessage = {
      role: 'system',
      content: systemPrompt,
    };

    const userMessage: AiMessage = {
      role: 'user',
      content: prompt,
    };

    const response = await callAi(uri, apiKey, model, [systemMessage, userMessage], {
      do_sample: true,
      temperature: 0.9,
    });

    // Parse simple text response into structured result
    return {
      issues: [],
      suggestions: [response.content],
    };
  }

  /**
   * Parse a numbered list response into rows.
   * Handles formats like "1. Item", "1) Item", "1: Item", or just "Item"
   * Matches the-weave's parseListResponse
   */
  private parseListResponse(text: string, startOffset: number = 0): AIGenerateResult {
    const lines = text.split('\n');
    const rows: AIGenerateResult['rows'] = [];

    for (const line of lines) {
      let cleaned = line.trim();
      if (!cleaned) continue;

      // Remove numbering prefixes
      cleaned = cleaned.replace(/^\d+[.\):]\s*/, '');
      cleaned = cleaned.replace(/^[-•*]\s*/, '');

      if (!cleaned) continue;

      const index = rows.length + startOffset;
      rows.push({
        floor: index + 1,
        ceiling: index + 1,
        result: cleaned,
      });
    }

    return { rows };
  }
}

// Export singleton instance
export const weaveAIService = new WeaveAIService();
