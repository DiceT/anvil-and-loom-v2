// ─────────────────────────────────────────────────────────────────────────────
// Thread Card Factory
// 
// Utilities for creating Thread Cards of various types.
// Ensures consistent structure and generates required fields.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ThreadCard,
  ThreadCardType,
  ContentBlock,
  DiceCardMeta,
  OracleCardMeta,
  AICardMeta,
  ClockCardMeta,
  ClockCardState,
  TrackCardMeta,
  TrackCardState,
} from '../types/threadCard';

// ─────────────────────────────────────────────────────────────────────────────
// ID Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a unique ID for a Thread Card.
 * Format: tc-{timestamp}-{random}
 */
export function generateCardId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `tc-${timestamp}-${random}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Base Card Creator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a base Thread Card with required fields.
 */
function createBaseCard(
  type: ThreadCardType,
  sessionId: string,
  header: string,
  result: string,
  content: ContentBlock[] = []
): ThreadCard {
  return {
    id: generateCardId(),
    sessionId,
    timestamp: new Date().toISOString(),
    type,
    header,
    content,
    result,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Type-Specific Factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a dice roll Thread Card.
 */
export function createDiceCard(
  sessionId: string,
  options: {
    expression: string;
    rolls: number[];
    modifier?: number;
    total: number;
    dc?: number;
    success?: boolean;
    outcome?: string;
    formattedResult?: string;
  }
): ThreadCard {
  const { expression, rolls, modifier, total, dc, success, outcome } = options;

  // Build header
  let header = `🎲 Dice: ${expression}`;
  if (dc !== undefined) {
    const icon = success ? '✅' : '❌';
    header += ` | DC ${dc} ${icon}`;
  }

  // Build content
  const content: ContentBlock[] = [
    { label: 'Expression', value: expression, type: 'code' },
    { label: 'Rolls', value: `[${rolls.join(', ')}]`, type: 'roll' },
  ];
  if (modifier !== undefined && modifier !== 0) {
    content.push({ label: 'Modifier', value: `${modifier >= 0 ? '+' : ''}${modifier}` });
  }

  // Build result
  let result: string;
  if (options.formattedResult) {
    result = options.formattedResult;
  } else if (outcome) {
    result = `Total: ${total} → ${outcome}`; // Simplified
  } else if (dc !== undefined) {
    const status = success ? 'SUCCESS' : 'FAILURE';
    result = `Total: ${total} vs DC ${dc} → ${status}`;
  } else {
    result = `Total: ${total}`;
  }

  const card = createBaseCard('dice', sessionId, header, result, content);

  // Add meta
  card.meta = {
    expression,
    rolls,
    modifier,
    total,
    dc,
    success,
  } as DiceCardMeta;

  return card;
}

/**
 * Creates an oracle result Thread Card.
 */
export function createOracleCard(
  sessionId: string,
  options: {
    tableId: string;
    tableName: string;
    category?: string;
    tableChain?: string[];
    rollValue: number | number[];
    result: string;
  }
): ThreadCard {
  const { tableId, tableName, category, tableChain = [tableName], rollValue, result } = options;

  let header = `🎴 Oracle: ${tableName}`;

  // Custom formatting for Aspects and Domains hierarchies
  // Requested Format: ORACLE: ASPECT - HAUNTED: ATMOSPHERE

  // Strategy 1: Use explicit Category if provided (Most Reliable)
  if (category) {
    if (category.startsWith('Aspect - ')) {
      const parent = category.replace('Aspect - ', '').toUpperCase();
      const subtable = tableName.toUpperCase();
      header = `🎴 ORACLE: ASPECT - ${parent}: ${subtable}`;
    } else if (category.startsWith('Domain - ')) {
      const parent = category.replace('Domain - ', '').toUpperCase();
      const subtable = tableName.toUpperCase();
      header = `🎴 ORACLE: DOMAIN - ${parent}: ${subtable}`;
    }
  }
  // Strategy 2: Fallback to Table Chain (for compatibility)
  else if (tableChain && tableChain.length >= 2) {
    // Helper to identify known Categories if missing from chain
    const KNOWN_ASPECTS = ['Blighted', 'Forgotten', 'Hallow', 'Haunted', 'Infested', 'Overgrown', 'Profane'];
    const KNOWN_DOMAINS = ['Catacombs', 'Cemetery', 'Dungeon', 'Forest', 'Marsh', 'Mire', 'Temple', 'Cavern', 'Desert', 'Frozen', 'Ocean', 'Ruins', 'Shadowlands', 'Stronghold', 'Underkeep'];

    const root = tableChain[0];
    if (KNOWN_ASPECTS.includes(root)) {
      header = `🎴 ORACLE: ASPECT - ${root.toUpperCase()}: ${(tableChain[1] || tableName).toUpperCase()}`;
    } else if (KNOWN_DOMAINS.includes(root)) {
      header = `🎴 ORACLE: DOMAIN - ${root.toUpperCase()}: ${(tableChain[1] || tableName).toUpperCase()}`;
    }
  }

  // Build content
  const content: ContentBlock[] = [
    { label: 'Tables', value: tableChain.join(' → '), type: 'table-chain' },
    { label: 'Roll', value: Array.isArray(rollValue) ? rollValue.join(', ') : String(rollValue) },
  ];

  const card = createBaseCard('oracle', sessionId, header, result, content);

  // Add meta
  card.meta = {
    tableId,
    tableName,
    tableChain,
    rollValue,
  } as OracleCardMeta;

  return card;
}

/**
 * Creates an AI interpretation Thread Card.
 */
export function createAICard(
  sessionId: string,
  options: {
    persona?: string;
    interpretation: string;
    model?: string;
    contextCards?: string[];
  }
): ThreadCard {
  const { persona = 'The Guide', interpretation, model, contextCards } = options;

  const header = `✨ ${persona}`;

  // AI cards typically don't have collapsible content
  const content: ContentBlock[] = [];
  if (contextCards && contextCards.length > 0) {
    content.push({ label: 'Context', value: `${contextCards.length} card(s)` });
  }

  const card = createBaseCard('ai', sessionId, header, interpretation, content);

  // Add meta
  card.meta = {
    persona,
    model,
    contextCards,
  } as AICardMeta;

  return card;
}

/**
 * Creates a user input Thread Card.
 */
export function createUserCard(
  sessionId: string,
  options: {
    input: string;
    source?: string;
  }
): ThreadCard {
  const { input, source = 'Player' } = options;

  const header = `📝 ${source}`;

  // User cards have no collapsible content
  const card = createBaseCard('user', sessionId, header, input, []);

  return card;
}

/**
 * Creates a clock Thread Card.
 */
export function createClockCard(
  sessionId: string,
  options: {
    name: string;
    segments: number;
    filled?: number;
    trigger?: string;
  }
): ThreadCard {
  const { name, segments, filled = 0, trigger } = options;

  const header = `⏱ Clock: ${name}`;

  // Build content
  const content: ContentBlock[] = [
    { label: 'Segments', value: String(segments) },
  ];
  if (trigger) {
    content.push({ label: 'Trigger', value: trigger });
  }

  const result = `Progress: ${filled}/${segments}`;

  const card = createBaseCard('clock', sessionId, header, result, content);

  // Add state
  card.state = {
    segments,
    filled,
  } as ClockCardState;

  // Add meta
  if (trigger) {
    card.meta = { trigger } as ClockCardMeta;
  }

  return card;
}

/**
 * Creates a progress track Thread Card.
 */
export function createTrackCard(
  sessionId: string,
  options: {
    name: string;
    segments?: number;
    filled?: number;
    difficulty?: string;
    description?: string;
  }
): ThreadCard {
  const { name, segments = 10, filled = 0, difficulty, description } = options;

  let header = `📊 Track: ${name}`;
  if (difficulty) {
    header += ` | ${difficulty}`;
  }

  // Build content
  const content: ContentBlock[] = [
    { label: 'Segments', value: String(segments) },
  ];
  if (difficulty) {
    content.push({ label: 'Difficulty', value: difficulty });
  }
  if (description) {
    content.push({ label: 'Description', value: description });
  }

  const result = `Progress: ${filled}/${segments}`;

  const card = createBaseCard('track', sessionId, header, result, content);

  // Add state
  card.state = {
    segments,
    filled,
  } as TrackCardState;

  // Add meta
  card.meta = {
    difficulty,
    description,
  } as TrackCardMeta;

  return card;
}

/**
 * Creates a system message Thread Card.
 */
export function createSystemCard(
  sessionId: string,
  options: {
    header: string;
    message?: string;
  }
): ThreadCard {
  const { header, message = '' } = options;

  return createBaseCard('system', sessionId, `⚙️ ${header}`, message, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Update Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the state of a clock card.
 */
export function updateClockState(
  card: ThreadCard,
  updates: Partial<ClockCardState>
): ThreadCard {
  if (card.type !== 'clock') {
    console.warn('[updateClockState] Card is not a clock');
    return card;
  }

  const currentState = (card.state as ClockCardState) || { segments: 4, filled: 0 };
  const newState = { ...currentState, ...updates };

  // Clamp filled to valid range
  newState.filled = Math.max(0, Math.min(newState.filled, newState.segments));

  return {
    ...card,
    state: newState,
    result: `Progress: ${newState.filled}/${newState.segments}`,
  };
}

/**
 * Updates the state of a track card.
 */
export function updateTrackState(
  card: ThreadCard,
  updates: Partial<TrackCardState>
): ThreadCard {
  if (card.type !== 'track') {
    console.warn('[updateTrackState] Card is not a track');
    return card;
  }

  const currentState = (card.state as TrackCardState) || { segments: 10, filled: 0 };
  const newState = { ...currentState, ...updates };

  // Clamp filled to valid range
  newState.filled = Math.max(0, Math.min(newState.filled, newState.segments));

  return {
    ...card,
    state: newState,
    result: `Progress: ${newState.filled}/${newState.segments}`,
  };
}

/**
 * Adds tags to a card.
 */
export function addTagsToCard(card: ThreadCard, tags: string[]): ThreadCard {
  const existingTags = card.tags || [];
  const newTags = [...new Set([...existingTags, ...tags])];

  return {
    ...card,
    tags: newTags,
  };
}

/**
 * Removes tags from a card.
 */
export function removeTagsFromCard(card: ThreadCard, tags: string[]): ThreadCard {
  const existingTags = card.tags || [];
  const newTags = existingTags.filter(t => !tags.includes(t));

  return {
    ...card,
    tags: newTags.length > 0 ? newTags : undefined,
  };
}
