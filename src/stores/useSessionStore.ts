// ─────────────────────────────────────────────────────────────────────────────
// Session Store
// 
// Zustand store for managing Live Session state.
// Handles card CRUD, session lifecycle, and persistence.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThreadCard, ThreadCardType } from '../types/threadCard';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Session {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    cards: ThreadCard[];
    tags?: string[];
    metadata?: Record<string, unknown>;
}

interface SessionState {
    // State
    sessions: Session[];
    activeSessionId: string | null;

    // Computed (via getters)
    activeSession: Session | null;
    activeCards: ThreadCard[];

    // Session CRUD
    createSession: (title: string) => Session;
    deleteSession: (sessionId: string) => void;
    updateSessionTitle: (sessionId: string, title: string) => void;
    setActiveSession: (sessionId: string | null) => void;

    // Card CRUD
    addCard: (card: ThreadCard) => void;
    updateCard: (cardId: string, updates: Partial<ThreadCard>) => void;
    deleteCard: (cardId: string) => void;
    reorderCards: (sessionId: string, cardIds: string[]) => void;

    // Card Queries
    getCard: (cardId: string) => ThreadCard | undefined;
    getCardsByType: (type: ThreadCardType) => ThreadCard[];
    getCardsByTag: (tag: string) => ThreadCard[];

    // Bulk Operations
    addCardsToSession: (sessionId: string, cards: ThreadCard[]) => void;
    clearSession: (sessionId: string) => void;

    // Persistence
    exportSession: (sessionId: string) => Session | null;
    importSession: (session: Session) => void;

    // File System Sync
    activeFilePath: string | null;
    setActiveSessionFilePath: (filePath: string | null) => void;
    saveActiveSession: () => void; // Debounced save
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store Implementation
// ─────────────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState>()(
    persist(
        (set, get) => ({
            // ─────────────────────────────────────────────────────────────────────
            // State
            // ─────────────────────────────────────────────────────────────────────

            sessions: [],
            activeSessionId: null,

            // ─────────────────────────────────────────────────────────────────────
            // Computed Getters
            // ─────────────────────────────────────────────────────────────────────

            get activeSession() {
                const { sessions, activeSessionId } = get();
                return sessions.find(s => s.id === activeSessionId) || null;
            },

            get activeCards() {
                const session = get().activeSession;
                return session?.cards || [];
            },

            // ─────────────────────────────────────────────────────────────────────
            // Session CRUD
            // ─────────────────────────────────────────────────────────────────────

            createSession: (title: string) => {
                const now = new Date().toISOString();
                const session: Session = {
                    id: generateSessionId(),
                    title,
                    createdAt: now,
                    updatedAt: now,
                    cards: [],
                };

                set(state => ({
                    sessions: [...state.sessions, session],
                    activeSessionId: session.id,
                }));

                return session;
            },

            deleteSession: (sessionId: string) => {
                set(state => ({
                    sessions: state.sessions.filter(s => s.id !== sessionId),
                    activeSessionId: state.activeSessionId === sessionId
                        ? null
                        : state.activeSessionId,
                }));
            },

            updateSessionTitle: (sessionId: string, title: string) => {
                set(state => ({
                    sessions: state.sessions.map(s =>
                        s.id === sessionId
                            ? { ...s, title, updatedAt: new Date().toISOString() }
                            : s
                    ),
                }));
            },

            setActiveSession: (sessionId: string | null) => {
                set({ activeSessionId: sessionId });
            },

            // ─────────────────────────────────────────────────────────────────────
            // Card CRUD
            // ─────────────────────────────────────────────────────────────────────

            addCard: (card: ThreadCard) => {
                const { activeSessionId } = get();
                if (!activeSessionId) {
                    console.warn('[SessionStore] No active session to add card to');
                    return;
                }

                set(state => ({
                    sessions: state.sessions.map(s =>
                        s.id === activeSessionId
                            ? {
                                ...s,
                                cards: [...s.cards, card],
                                updatedAt: new Date().toISOString(),
                            }
                            : s
                    ),
                }));

                get().saveActiveSession();
            },

            updateCard: (cardId: string, updates: Partial<ThreadCard>) => {
                set(state => ({
                    sessions: state.sessions.map(s => ({
                        ...s,
                        cards: s.cards.map(c =>
                            c.id === cardId ? { ...c, ...updates } : c
                        ),
                        updatedAt: new Date().toISOString(),
                    })),
                }));
            },

            deleteCard: (cardId: string) => {
                set(state => ({
                    sessions: state.sessions.map(s => ({
                        ...s,
                        cards: s.cards.filter(c => c.id !== cardId),
                        updatedAt: new Date().toISOString(),
                    })),
                }));
            },

            reorderCards: (sessionId: string, cardIds: string[]) => {
                set(state => ({
                    sessions: state.sessions.map(s => {
                        if (s.id !== sessionId) return s;

                        // Create map of existing cards
                        const cardMap = new Map(s.cards.map(c => [c.id, c]));

                        // Reorder based on provided IDs
                        const reorderedCards = cardIds
                            .map(id => cardMap.get(id))
                            .filter((c): c is ThreadCard => c !== undefined);

                        return {
                            ...s,
                            cards: reorderedCards,
                            updatedAt: new Date().toISOString(),
                        };
                    }),
                }));
            },

            // ─────────────────────────────────────────────────────────────────────
            // Card Queries
            // ─────────────────────────────────────────────────────────────────────

            getCard: (cardId: string) => {
                const { sessions } = get();
                for (const session of sessions) {
                    const card = session.cards.find(c => c.id === cardId);
                    if (card) return card;
                }
                return undefined;
            },

            getCardsByType: (type: ThreadCardType) => {
                const { activeCards } = get();
                return activeCards.filter(c => c.type === type);
            },

            getCardsByTag: (tag: string) => {
                const { activeCards } = get();
                return activeCards.filter(c => c.tags?.includes(tag));
            },

            // ─────────────────────────────────────────────────────────────────────
            // Bulk Operations
            // ─────────────────────────────────────────────────────────────────────

            addCardsToSession: (sessionId: string, cards: ThreadCard[]) => {
                set(state => ({
                    sessions: state.sessions.map(s =>
                        s.id === sessionId
                            ? {
                                ...s,
                                cards: [...s.cards, ...cards],
                                updatedAt: new Date().toISOString(),
                            }
                            : s
                    ),
                }));
            },

            clearSession: (sessionId: string) => {
                set(state => ({
                    sessions: state.sessions.map(s =>
                        s.id === sessionId
                            ? {
                                ...s,
                                cards: [],
                                updatedAt: new Date().toISOString(),
                            }
                            : s
                    ),
                }));
            },

            // ─────────────────────────────────────────────────────────────────────
            // Import/Export
            // ─────────────────────────────────────────────────────────────────────

            exportSession: (sessionId: string) => {
                const { sessions } = get();
                return sessions.find(s => s.id === sessionId) || null;
            },

            importSession: (session: Session) => {
                set(state => {
                    const existingIndex = state.sessions.findIndex(s => s.id === session.id);

                    if (existingIndex >= 0) {
                        // Update existing session
                        const newSessions = [...state.sessions];
                        newSessions[existingIndex] = { ...session };
                        return { sessions: newSessions };
                    }

                    // Add new session
                    return {
                        sessions: [...state.sessions, session],
                    };
                });
            },

            // ─────────────────────────────────────────────────────────────────────
            // File System Sync
            // ─────────────────────────────────────────────────────────────────────

            activeFilePath: null,

            setActiveSessionFilePath: (filePath: string | null) => {
                set({ activeFilePath: filePath });
            },

            saveActiveSession: debounce(async () => {
                const { activeSession, activeFilePath } = get();
                if (!activeSession || !activeFilePath) return;

                const content = JSON.stringify(activeSession, null, 2);

                try {
                    // Dynamically import to avoid circular dependencies if possible, 
                    // or just use the store directly if already imported.
                    // We'll import here to be safe and lazy.
                    const { useTapestryStore } = await import('./useTapestryStore');
                    await useTapestryStore.getState().saveFile(activeFilePath, content);
                    console.log('[SessionStore] Saved session to:', activeFilePath);
                } catch (error) {
                    console.error('[SessionStore] Failed to auto-save session:', error);
                }
            }, 500),
        }),
        {
            name: 'anvil-loom-sessions',
            partialize: (state) => ({
                sessions: state.sessions,
                activeSessionId: state.activeSessionId,
                activeFilePath: state.activeFilePath,
            }),
        }
    )
);

// Helper for debouncing
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Selector Hooks (for performance optimization)
// ─────────────────────────────────────────────────────────────────────────────

export const useActiveSession = () =>
    useSessionStore(state => {
        const { sessions, activeSessionId } = state;
        return sessions.find(s => s.id === activeSessionId) || null;
    });

const EMPTY_CARDS: ThreadCard[] = [];

export const useActiveCards = () =>
    useSessionStore(state => {
        const { sessions, activeSessionId } = state;
        const session = sessions.find(s => s.id === activeSessionId);
        return session?.cards || EMPTY_CARDS;
    });

export const useSessionList = () =>
    useSessionStore(state => state.sessions.map(s => ({
        id: s.id,
        title: s.title,
        cardCount: s.cards.length,
        updatedAt: s.updatedAt,
    })));
