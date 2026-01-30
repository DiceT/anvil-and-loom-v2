// ─────────────────────────────────────────────────────────────────────────────
// Thread Card Markdown Conversion
// 
// Converts Thread Cards to markdown format for export and curation.
// Each card type has a defined template that produces consistent output.
// ─────────────────────────────────────────────────────────────────────────────

import type { 
  ThreadCard, 
  ThreadCardType, 
  ContentBlock,
  ClockCardState,
  TrackCardState,
} from '../types/threadCard';

// ─────────────────────────────────────────────────────────────────────────────
// Content Block Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a single content block as a blockquote line.
 */
function formatContentBlock(block: ContentBlock): string {
  if (block.label) {
    return `${block.label}: ${block.value}`;
  }
  return block.value;
}

/**
 * Formats all content blocks as a blockquote section.
 * Returns empty string if no content.
 */
function formatContentSection(content: ContentBlock[]): string {
  if (!content || content.length === 0) {
    return '';
  }
  
  const lines = content.map(formatContentBlock);
  return `> ${lines.join('\n> ')}\n\n`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type-Specific Templates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a dice card to markdown.
 * 
 * Output:
 * **🎲 Dice: 2d6+1**
 * > Expression: 2d6+1
 * > Rolls: [4, 2]
 * 
 * **Total: 7 → Weak Hit**
 */
function diceToMarkdown(card: ThreadCard): string {
  const contentSection = formatContentSection(card.content);
  return `**${card.header}**\n${contentSection}**${card.result}**`;
}

/**
 * Converts an oracle card to markdown.
 * 
 * Output:
 * **🎴 Oracle: Haunted Catacombs**
 * > Tables: Haunted Catacombs
 * > Roll: 4
 * 
 * **Aspect: Haunted**
 */
function oracleToMarkdown(card: ThreadCard): string {
  const contentSection = formatContentSection(card.content);
  return `**${card.header}**\n${contentSection}**${card.result}**`;
}

/**
 * Converts an AI interpretation card to markdown.
 * 
 * Output:
 * **✨ The Archivist**
 * 
 * The spirits here are not merely wandering echoes...
 */
function aiToMarkdown(card: ThreadCard): string {
  return `**${card.header}**\n\n${card.result}`;
}

/**
 * Converts a user input card to markdown.
 * 
 * Output:
 * *I want to search the tomb for any clues...*
 */
function userToMarkdown(card: ThreadCard): string {
  return `*${card.result}*`;
}

/**
 * Converts a clock card to markdown.
 * 
 * Output:
 * **⏱ Clock: Ritual Disruption** (2/6)
 */
function clockToMarkdown(card: ThreadCard): string {
  const state = (card.state as ClockCardState) || { filled: 0, segments: 4 };
  return `**${card.header}** (${state.filled}/${state.segments})`;
}

/**
 * Converts a track card to markdown.
 * 
 * Output:
 * **📊 Track: Investigation** (3/10) — Dangerous
 */
function trackToMarkdown(card: ThreadCard): string {
  const state = (card.state as TrackCardState) || { filled: 0, segments: 10 };
  const meta = card.meta || {};
  const difficulty = meta.difficulty ? ` — ${meta.difficulty}` : '';
  return `**${card.header}** (${state.filled}/${state.segments})${difficulty}`;
}

/**
 * Converts a system card to markdown.
 * 
 * Output:
 * **System Message**
 * 
 * Content here...
 */
function systemToMarkdown(card: ThreadCard): string {
  if (card.result) {
    return `**${card.header}**\n\n${card.result}`;
  }
  return `**${card.header}**`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template Map
// ─────────────────────────────────────────────────────────────────────────────

const markdownTemplates: Record<ThreadCardType, (card: ThreadCard) => string> = {
  dice: diceToMarkdown,
  oracle: oracleToMarkdown,
  ai: aiToMarkdown,
  user: userToMarkdown,
  clock: clockToMarkdown,
  track: trackToMarkdown,
  system: systemToMarkdown,
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a single Thread Card to markdown.
 */
export function threadCardToMarkdown(card: ThreadCard): string {
  const template = markdownTemplates[card.type];
  if (!template) {
    console.warn(`[threadCardToMarkdown] Unknown card type: ${card.type}`);
    return systemToMarkdown(card);
  }
  return template(card);
}

/**
 * Converts multiple Thread Cards to markdown, separated by blank lines.
 */
export function threadCardsToMarkdown(cards: ThreadCard[]): string {
  return cards.map(threadCardToMarkdown).join('\n\n');
}

/**
 * Converts a session (array of Thread Cards) to a full markdown document.
 * Optionally includes a header with session metadata.
 */
export function sessionToMarkdown(
  cards: ThreadCard[],
  options?: {
    title?: string;
    includeTimestamps?: boolean;
    includeHeader?: boolean;
  }
): string {
  const { title, includeTimestamps = false, includeHeader = true } = options || {};
  
  const parts: string[] = [];
  
  // Optional header
  if (includeHeader && title) {
    parts.push(`# ${title}\n`);
  }
  
  // Convert each card
  for (const card of cards) {
    let cardMarkdown = threadCardToMarkdown(card);
    
    // Optionally prefix with timestamp
    if (includeTimestamps) {
      const time = new Date(card.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      cardMarkdown = `*${time}*\n\n${cardMarkdown}`;
    }
    
    parts.push(cardMarkdown);
  }
  
  return parts.join('\n\n---\n\n');
}

/**
 * Converts selected Thread Cards to markdown for curation.
 * Allows filtering by tags or IDs.
 */
export function curateToMarkdown(
  cards: ThreadCard[],
  options?: {
    ids?: string[];
    tags?: string[];
    types?: ThreadCardType[];
    excludeTypes?: ThreadCardType[];
  }
): string {
  let filtered = [...cards];
  
  // Filter by IDs
  if (options?.ids && options.ids.length > 0) {
    filtered = filtered.filter(c => options.ids!.includes(c.id));
  }
  
  // Filter by tags
  if (options?.tags && options.tags.length > 0) {
    filtered = filtered.filter(c => 
      c.tags?.some(t => options.tags!.includes(t))
    );
  }
  
  // Filter by types
  if (options?.types && options.types.length > 0) {
    filtered = filtered.filter(c => options.types!.includes(c.type));
  }
  
  // Exclude types
  if (options?.excludeTypes && options.excludeTypes.length > 0) {
    filtered = filtered.filter(c => !options.excludeTypes!.includes(c.type));
  }
  
  return threadCardsToMarkdown(filtered);
}
