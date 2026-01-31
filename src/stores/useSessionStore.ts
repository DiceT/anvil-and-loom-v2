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
    renameSession: (title: string) => Promise<void>;
    setActiveSession: (sessionId: string | null) => void;

    // Card CRUD
    addCard: (card: ThreadCard) => void;
    updateCard: (cardId: string, updates: Partial<ThreadCard>) => void;
    deleteCard: (cardId: string) => void;
    deleteCards: (cardIds: string[]) => void;
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
    persistSession?: () => Promise<void>; // Direct save (internal/advanced use)
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

            renameSession: async (title: string) => {
                const { activeSessionId, activeFilePath } = get();

                if (!activeSessionId || !activeFilePath) {
                    console.warn('[SessionStore] No active session to rename');
                    return;
                }

                // 1. Update in-memory title
                set(state => ({
                    sessions: state.sessions.map(s =>
                        s.id === activeSessionId
                            ? { ...s, title, updatedAt: new Date().toISOString() }
                            : s
                    ),
                }));

                try {
                    // 2. Rename file
                    const { useTapestryStore } = await import('./useTapestryStore');
                    // We need to ensure we only rename if the title causes a filename change
                    // But for now, we assume the user wants the file to match the title
                    const newPath = await useTapestryStore.getState().renameEntry(activeFilePath, title);
                    // 3. Update active file path
                    set({ activeFilePath: newPath });

                    // 4. Save IMMEDIATELY to ensure content (with new title) is written to new path
                    // We use persistSession to bypass debounce and ensure await
                    const { persistSession } = get();
                    if (persistSession) {
                        await persistSession();
                    }

                    // 5. Update EditorStore (Tab)
                    const { useEditorStore } = await import('./useEditorStore');
                    useEditorStore.getState().handleRename(activeFilePath, newPath, title);

                    // 6. Update TabStore (Visible Tabs)
                    const { useTabStore } = await import('./useTabStore');
                    // Find the tab with the old ID (which is mostly likely the session ID, assuming tab ID = session ID / file ID)
                    // Actually, for sessions, the tab ID is usually the session ID. 
                    // Let's check how openTab is called.
                    // In EditorStore.openEntry: id: entry.id.
                    // In renameEntry, does entry.id change? 
                    // Tapestry entries usually have ID = path or a UUID. 
                    // If ID = UUID, it shouldn't change.
                    // If ID = path, it changes.
                    // Tapestry entries usually use UUIDs generated or paths.
                    // If ID persists, we just update title.
                    // Helper: find tab by ID matching activeSessionId.
                    useTabStore.getState().updateTabTitle(activeSessionId, title);

                    // 7. Reload tree (with retry/delay to ensure FS catches up)
                    setTimeout(() => {
                        useTapestryStore.getState().loadTree();
                    }, 100);

                } catch (error) {
                    console.error('[SessionStore] Failed to rename session file:', error);
                }
            },

            setActiveSession: (sessionId: string | null) => {
                set({ activeSessionId: sessionId });
            },

            // ─────────────────────────────────────────────────────────────────────
            // Card CRUD
            // ─────────────────────────────────────────────────────────────────────

            addCard: async (card: ThreadCard) => {
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

                // Force immediate save for reliability
                const { persistSession } = get();
                if (persistSession) {
                    await persistSession();
                }
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
                get().saveActiveSession();
            },

            deleteCard: async (cardId: string) => {
                console.log('[SessionStore] Deleting card:', cardId);
                set(state => ({
                    sessions: state.sessions.map(s => ({
                        ...s,
                        cards: s.cards.filter(c => c.id !== cardId),
                        updatedAt: new Date().toISOString(),
                    })),
                }));

                // Force immediate save
                const { persistSession } = get();
                if (persistSession) {
                    await persistSession();
                } else {
                    console.error('[SessionStore] persistSession not found');
                }
            },

            deleteCards: async (cardIds: string[]) => {
                console.log('[SessionStore] Deleting cards (batch):', cardIds.length);
                const ids = new Set(cardIds);
                set(state => ({
                    sessions: state.sessions.map(s => ({
                        ...s,
                        cards: s.cards.filter(c => !ids.has(c.id)),
                        updatedAt: new Date().toISOString(),
                    })),
                }));

                // Force immediate save
                const { persistSession } = get();
                if (persistSession) {
                    await persistSession();
                }
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
                get().saveActiveSession();
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

            // Internal helper that performs the actual save (exposed via debounce below)
            persistSession: async () => {
                const { sessions, activeSessionId, activeFilePath } = get();
                // Manually find session to ensure we get the latest state
                const currentSession = sessions.find(s => s.id === activeSessionId);

                if (!currentSession || !activeFilePath) {
                    console.error('[SessionStore] Skip save - missing session or path.', { currentSessionId: activeSessionId, activeFilePath });
                    return;
                }

                const content = JSON.stringify(currentSession, null, 2);

                try {
                    const { useTapestryStore } = await import('./useTapestryStore');
                    await useTapestryStore.getState().saveFile(activeFilePath, content);
                    console.log('[SessionStore] Saved session to:', activeFilePath);

                    // Sync consistency with EditorStore
                    // This prevents stale content from re-importing if the Editor re-renders or checks the file content
                    const { useEditorStore } = await import('./useEditorStore');
                    const editorStore = useEditorStore.getState();

                    // We need to find the entry ID by path
                    const openEntries = editorStore.openEntries;
                    const entry = openEntries.find(e => e.path === activeFilePath);

                    if (entry) {
                        editorStore.updateEntryContent(entry.id, content);
                        // Since we just saved, we might want to ensure it's not marked dirty causing loop, 
                        // but updateEntryContent marks dirty. 
                        // However, SessionPanel doesn't trigger save from dirty state (Ctrl+S ignored).
                        // The re-import logic in TapestryEditor checks `activeEntry.content`.
                        // By updating it here, we ensure that IF TapestryEditor re-runs logic, it sees the NEW content.
                    }

                } catch (error) {
                    console.error('[SessionStore] Failed to save session:', error);
                }
            },

            saveActiveSession: debounce(() => {
                get().persistSession?.();
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
