// ─────────────────────────────────────────────────────────────────────────────
// Action Dispatcher
// 
// Central hub for routing Thread Card actions to appropriate handlers.
// Connects the UI layer to the various engines (dice, oracle, AI, etc.)
// ─────────────────────────────────────────────────────────────────────────────

import { useSessionStore } from '../stores/useSessionStore';
import {
    createDiceCard,
    createOracleCard,
    createAICard,
    createClockCard,
    createTrackCard,
    updateClockState,
    updateTrackState,
    createUserCard, // Changed from createCard since I saw createUserCard in InputBar, checking definition...
} from '../utils/threadCardFactory';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ActionHandler = (params: Record<string, unknown>) => void | Promise<void>;

export interface ActionRegistry {
    [key: string]: ActionHandler;
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates the action registry with all handlers.
 * This function is called with dependencies injected.
 */
export function createActionRegistry(dependencies: {
    diceEngine: any;      // Your dice engine
    weaveEngine: any;     // Your oracle/weave engine
    aiEngine: any;        // Your AI engine
    sessionStore: typeof useSessionStore;
}): ActionRegistry {
    const { diceEngine, weaveEngine, aiEngine, sessionStore } = dependencies;

    return {
        // ─────────────────────────────────────────────────────────────────────
        // Thread Actions
        // ─────────────────────────────────────────────────────────────────────

        'thread.create': (params) => {
            const { content } = params as { content: string };
            const { activeSessionId, addCard } = sessionStore.getState();

            if (!activeSessionId) return;

            // Simple user card
            const card = createUserCard(activeSessionId, { input: content });
            addCard(card);
        },

        // ─────────────────────────────────────────────────────────────────────
        // Dice Actions
        // ─────────────────────────────────────────────────────────────────────

        'dice.roll': async (params) => {
            const { expression } = params as { expression: string };
            const { activeSessionId, addCard } = sessionStore.getState();

            if (!activeSessionId || !expression) return;

            // Roll using your dice engine
            const result = await diceEngine.roll(expression);

            // Create and add card
            const card = createDiceCard(activeSessionId, {
                expression,
                rolls: result.rolls,
                modifier: result.modifier,
                total: result.total,
                dc: result.dc,
                success: result.success,
            });

            addCard(card);
        },

        'dice.reroll': async (params) => {
            const { expression } = params as { expression?: string };
            if (expression) {
                // Re-roll using the same expression
                await createActionRegistry(dependencies)['dice.roll']({ expression });
            }
        },

        // ─────────────────────────────────────────────────────────────────────
        // Oracle Actions
        // ─────────────────────────────────────────────────────────────────────

        'oracle.query': async (params) => {
            const { tableId, tableName } = params as { tableId?: string; tableName?: string };
            const { activeSessionId, addCard } = sessionStore.getState();

            if (!activeSessionId) return;

            // Query using your weave engine
            const result = await weaveEngine.roll(tableId || tableName);

            // Create and add card
            const card = createOracleCard(activeSessionId, {
                tableId: result.tableId,
                tableName: result.tableName,
                tableChain: result.tableChain,
                rollValue: result.rollValue,
                result: result.result,
            });

            addCard(card);
        },

        'oracle.reroll': async (params) => {
            const { tableId } = params as { tableId?: string };
            if (tableId) {
                await createActionRegistry(dependencies)['oracle.query']({ tableId });
            }
        },

        'oracle.drill': async (params) => {
            // Drill down into a sub-table based on result
            const { tableId, result } = params as { tableId?: string; result?: string };
            console.log('Drill params:', tableId, result);
            // Implementation depends on your weave engine's drill-down logic
            console.log('[ActionDispatcher] oracle.drill not yet implemented', params);
        },

        // ─────────────────────────────────────────────────────────────────────
        // AI Actions
        // ─────────────────────────────────────────────────────────────────────

        'ai.interpret': async (params) => {
            const { cardId, context } = params as { cardId?: string; context?: string };
            const { activeSessionId, addCard } = sessionStore.getState();
            const state = sessionStore.getState();

            if (!activeSessionId) return;

            // Gather context from recent cards
            const recentCards = state.sessions
                .find(s => s.id === activeSessionId)
                ?.cards.slice(-5) || [];

            // Call your AI engine
            const interpretation = await aiEngine.interpret({
                cards: recentCards,
                specificCardId: cardId,
                additionalContext: context,
            });

            // Create and add card
            const card = createAICard(activeSessionId, {
                persona: interpretation.persona || 'The Guide',
                interpretation: interpretation.text,
                model: interpretation.model,
                contextCards: recentCards.map(c => c.id),
            });

            addCard(card);
        },

        'ai.regenerate': async (params) => {
            const { cardId } = params as { cardId: string };
            console.log('Regenerate:', cardId);
            // Get the original card's context and regenerate
            // Implementation depends on your AI engine
            console.log('[ActionDispatcher] ai.regenerate not yet implemented', params);
        },

        'ai.expand': async (params) => {
            const { cardId } = params as { cardId: string };
            console.log('Expand:', cardId);
            // Expand on the existing interpretation
            console.log('[ActionDispatcher] ai.expand not yet implemented', params);
        },

        // ─────────────────────────────────────────────────────────────────────
        // Clock Actions
        // ─────────────────────────────────────────────────────────────────────

        'clock.create': (params) => {
            const { name, segments, trigger } = params as {
                name: string;
                segments: number;
                trigger?: string;
            };
            const { activeSessionId, addCard } = sessionStore.getState();

            if (!activeSessionId || !name) return;

            const card = createClockCard(activeSessionId, {
                name,
                segments: segments || 4,
                filled: 0,
                trigger,
            });

            addCard(card);
        },

        'clock.advance': (params) => {
            const { cardId } = params as { cardId: string };
            const { getCard, updateCard } = sessionStore.getState();

            const card = getCard(cardId);
            if (!card || card.type !== 'clock') return;

            const updated = updateClockState(card as any, {
                filled: ((card.state as any)?.filled || 0) + 1,
            });

            updateCard(cardId, updated);
        },

        'clock.reduce': (params) => {
            const { cardId } = params as { cardId: string };
            const { getCard, updateCard } = sessionStore.getState();

            const card = getCard(cardId);
            if (!card || card.type !== 'clock') return;

            const updated = updateClockState(card as any, {
                filled: Math.max(0, ((card.state as any)?.filled || 0) - 1),
            });

            updateCard(cardId, updated);
        },

        'clock.reset': (params) => {
            const { cardId } = params as { cardId: string };
            const { getCard, updateCard } = sessionStore.getState();

            const card = getCard(cardId);
            if (!card || card.type !== 'clock') return;

            const updated = updateClockState(card as any, { filled: 0 });
            updateCard(cardId, updated);
        },

        // ─────────────────────────────────────────────────────────────────────
        // Track Actions
        // ─────────────────────────────────────────────────────────────────────

        'track.create': (params) => {
            const { name, segments, difficulty, description } = params as {
                name: string;
                segments?: number;
                difficulty?: string;
                description?: string;
            };
            const { activeSessionId, addCard } = sessionStore.getState();

            if (!activeSessionId || !name) return;

            const card = createTrackCard(activeSessionId, {
                name,
                segments: segments || 10,
                filled: 0,
                difficulty,
                description,
            });

            addCard(card);
        },

        'track.advance': (params) => {
            const { cardId, amount } = params as { cardId: string; amount?: number };
            const { getCard, updateCard } = sessionStore.getState();

            const card = getCard(cardId);
            if (!card || card.type !== 'track') return;

            const updated = updateTrackState(card as any, {
                filled: Math.min(
                    (card.state as any)?.segments || 10,
                    ((card.state as any)?.filled || 0) + (amount || 1)
                ),
            });

            updateCard(cardId, updated);
        },

        'track.reduce': (params) => {
            const { cardId, amount } = params as { cardId: string; amount?: number };
            const { getCard, updateCard } = sessionStore.getState();

            const card = getCard(cardId);
            if (!card || card.type !== 'track') return;

            const updated = updateTrackState(card as any, {
                filled: Math.max(0, ((card.state as any)?.filled || 0) - (amount || 1)),
            });

            updateCard(cardId, updated);
        },

        'track.reset': (params) => {
            const { cardId } = params as { cardId: string };
            const { getCard, updateCard } = sessionStore.getState();

            const card = getCard(cardId);
            if (!card || card.type !== 'track') return;

            const updated = updateTrackState(card as any, { filled: 0 });
            updateCard(cardId, updated);
        },
    };
}
