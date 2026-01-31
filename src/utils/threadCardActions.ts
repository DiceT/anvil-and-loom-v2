// ─────────────────────────────────────────────────────────────────────────────
// Thread Card Actions
// 
// Derives available actions for each Thread Card based on its type.
// Actions are buttons displayed on the card that trigger specific behaviors.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ThreadCard,
  ThreadCardType,
  ActionButton,
  DiceCardMeta,
  OracleCardMeta,
  ClockCardState,
  TrackCardState,
} from '../types/threadCard';

// ─────────────────────────────────────────────────────────────────────────────
// Action Definitions by Type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns actions for a dice roll card.
 */
function getDiceActions(card: ThreadCard): ActionButton[] {
  const meta = card.meta as DiceCardMeta | undefined;

  return [
    {
      id: 'reroll',
      label: 'Re-roll',
      action: 'dice.reroll',
      params: {
        expression: meta?.expression,
        meta: meta // Pass the entire meta object to preserve context (resolution, bonus, etc.)
      },
    },
    {
      id: 'interpret',
      label: 'Interpret',
      action: 'ai.interpret',
      params: { cardId: card.id },
    },
  ];
}

/**
 * Returns actions for an oracle card.
 */
function getOracleActions(card: ThreadCard): ActionButton[] {
  const meta = card.meta as OracleCardMeta | undefined;

  return [
    {
      id: 'reroll',
      label: 'Re-roll',
      action: 'oracle.reroll',
      params: { tableId: meta?.tableId },
    },
    {
      id: 'drill',
      label: 'Drill Down',
      action: 'oracle.drill',
      params: {
        tableId: meta?.tableId,
        result: card.result,
      },
    },
    {
      id: 'interpret',
      label: 'Interpret',
      action: 'ai.interpret',
      params: { cardId: card.id },
    },
  ];
}

/**
 * Returns actions for an AI interpretation card.
 */
function getAIActions(card: ThreadCard): ActionButton[] {
  return [
    {
      id: 'regenerate',
      label: 'Regenerate',
      action: 'ai.regenerate',
      params: { cardId: card.id },
    },
    {
      id: 'expand',
      label: 'Expand',
      action: 'ai.expand',
      params: { cardId: card.id },
    },
    {
      id: 'edit',
      label: 'Edit',
      action: 'card.edit',
      params: { cardId: card.id },
    },
  ];
}

/**
 * Returns actions for a user input card.
 */
function getUserActions(card: ThreadCard): ActionButton[] {
  return [
    {
      id: 'roll',
      label: 'Roll',
      action: 'dice.prompt',
      params: { context: card.result },
    },
    {
      id: 'oracle',
      label: 'Oracle',
      action: 'oracle.prompt',
      params: { context: card.result },
    },
    {
      id: 'interpret',
      label: 'Interpret',
      action: 'ai.interpret',
      params: { cardId: card.id },
    },
    {
      id: 'edit',
      label: 'Edit',
      action: 'card.edit',
      params: { cardId: card.id },
    },
  ];
}

/**
 * Returns actions for a clock card.
 */
function getClockActions(card: ThreadCard): ActionButton[] {
  const state = card.state as ClockCardState | undefined;
  const filled = state?.filled ?? 0;
  const segments = state?.segments ?? 4;

  return [
    {
      id: 'advance',
      label: '+1',
      action: 'clock.advance',
      params: { cardId: card.id },
      disabled: filled >= segments,
    },
    {
      id: 'reduce',
      label: '-1',
      action: 'clock.reduce',
      params: { cardId: card.id },
      disabled: filled <= 0,
    },
    {
      id: 'reset',
      label: 'Reset',
      action: 'clock.reset',
      params: { cardId: card.id },
      disabled: filled === 0,
    },
  ];
}

/**
 * Returns actions for a progress track card.
 */
function getTrackActions(card: ThreadCard): ActionButton[] {
  const state = card.state as TrackCardState | undefined;
  const filled = state?.filled ?? 0;
  const segments = state?.segments ?? 10;

  return [
    {
      id: 'advance',
      label: '+1',
      action: 'track.advance',
      params: { cardId: card.id },
      disabled: filled >= segments,
    },
    {
      id: 'reduce',
      label: '-1',
      action: 'track.reduce',
      params: { cardId: card.id },
      disabled: filled <= 0,
    },
    {
      id: 'reset',
      label: 'Reset',
      action: 'track.reset',
      params: { cardId: card.id },
      disabled: filled === 0,
    },
    {
      id: 'resolve',
      label: 'Resolve',
      action: 'track.resolve',
      params: { cardId: card.id },
    },
  ];
}

/**
 * Returns actions for a system card.
 */
function getSystemActions(_card: ThreadCard): ActionButton[] {
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Map
// ─────────────────────────────────────────────────────────────────────────────

const actionsByType: Record<ThreadCardType, (card: ThreadCard) => ActionButton[]> = {
  dice: getDiceActions,
  oracle: getOracleActions,
  ai: getAIActions,
  user: getUserActions,
  clock: getClockActions,
  track: getTrackActions,
  system: getSystemActions,
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the available actions for a Thread Card based on its type.
 */
export function getActionsForCard(card: ThreadCard): ActionButton[] {
  const getActions = actionsByType[card.type];
  if (!getActions) {
    console.warn(`[getActionsForCard] Unknown card type: ${card.type}`);
    return [];
  }
  return getActions(card);
}

/**
 * Returns a specific action from a card by ID.
 */
export function getActionById(card: ThreadCard, actionId: string): ActionButton | undefined {
  const actions = getActionsForCard(card);
  return actions.find(a => a.id === actionId);
}

/**
 * Checks if a card has a specific action available.
 */
export function hasAction(card: ThreadCard, actionId: string): boolean {
  const actions = getActionsForCard(card);
  return actions.some(a => a.id === actionId && !a.disabled);
}

// ─────────────────────────────────────────────────────────────────────────────
// Common Actions (available on all cards)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns common actions available on all cards.
 * These are typically shown in a secondary menu or context menu.
 */
export function getCommonActions(card: ThreadCard): ActionButton[] {
  return [
    {
      id: 'copy',
      label: 'Copy',
      action: 'card.copy',
      params: { cardId: card.id },
    },
    {
      id: 'delete',
      label: 'Delete',
      action: 'card.delete',
      params: { cardId: card.id },
    },
    {
      id: 'tag',
      label: 'Tag',
      action: 'card.tag',
      params: { cardId: card.id },
    },
    {
      id: 'curate',
      label: 'Send to Panel',
      action: 'card.curate',
      params: { cardId: card.id },
    },
  ];
}

/**
 * Returns all actions for a card (type-specific + common).
 */
export function getAllActions(card: ThreadCard): {
  primary: ActionButton[];
  common: ActionButton[];
} {
  return {
    primary: getActionsForCard(card),
    common: getCommonActions(card),
  };
}
