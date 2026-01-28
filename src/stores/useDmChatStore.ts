import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    Chat,
    ChatMessage,
    PrecisionLevel,
    QuickAction,
    DEFAULT_QUICK_ACTIONS,
    createChat,
    createUserMessage,
    createAssistantMessage,
} from '../types/dmChat'
import { useTapestryStore } from './useTapestryStore'
import { useAiStore } from './useAiStore'

interface DmChatState {
    // ─── Current Chat State ───
    activeChat: Chat | null
    isLoading: boolean
    error: string | null

    // ─── Settings ───
    selectedPersonaId: string
    precisionLevel: PrecisionLevel
    includeActivePanel: boolean

    // ─── Chat History ───
    chatHistory: Chat[]  // For current tapestry only

    // ─── UI State ───
    showHistory: boolean

    // ─── Actions: Chat Management ───
    newChat: () => void
    loadChat: (chatId: string) => void
    deleteChat: (chatId: string) => void
    renameChat: (chatId: string, title: string) => void

    // ─── Actions: Messaging ───
    sendMessage: (content: string) => Promise<void>
    regenerateLastResponse: () => Promise<void>

    // ─── Actions: Settings ───
    setPersona: (personaId: string) => void
    setPrecision: (level: PrecisionLevel) => void
    setIncludeActivePanel: (include: boolean) => void

    // ─── Actions: UI ───
    toggleHistory: () => void

    // ─── Actions: Output ───
    copyResponse: (messageId: string) => void
    insertAsThread: (messageId: string) => Promise<void>
    createPanelFromResponse: (messageId: string) => Promise<void>

    // ─── Actions: Quick Actions ───
    executeQuickAction: (action: QuickAction) => Promise<void>

    // ─── Actions: Lifecycle ───
    loadChatsForTapestry: (tapestryId: string) => Promise<void>
    saveCurrentChat: () => Promise<void>
}

export const useDmChatStore = create<DmChatState>()(
    persist(
        (set, get) => ({
            // ─── Initial State ───
            activeChat: null,
            isLoading: false,
            error: null,

            selectedPersonaId: 'the-guide',  // Default persona
            precisionLevel: 3,
            includeActivePanel: true,

            chatHistory: [],
            showHistory: false,

            // ─────────────────────────────────────────────────────────────────────
            // Chat Management
            // ─────────────────────────────────────────────────────────────────────

            newChat: () => {
                const tapestryId = useTapestryStore.getState().activeTapestryId

                if (!tapestryId) {
                    console.error('[DmChatStore] newChat: No active tapestry ID')
                    return
                }

                // Save current chat first
                get().saveCurrentChat()

                const chat = createChat(tapestryId)
                chat.lastPersonaId = get().selectedPersonaId
                chat.lastPrecisionLevel = get().precisionLevel

                set({ activeChat: chat, error: null })
            },

            loadChat: (chatId: string) => {
                const chat = get().chatHistory.find(c => c.id === chatId)
                if (!chat) return

                // Save current chat first
                get().saveCurrentChat()

                // Restore settings from loaded chat
                set({
                    activeChat: chat,
                    selectedPersonaId: chat.lastPersonaId || get().selectedPersonaId,
                    precisionLevel: chat.lastPrecisionLevel || get().precisionLevel,
                    showHistory: false,
                    error: null,
                })
            },

            deleteChat: (chatId: string) => {
                set(state => ({
                    chatHistory: state.chatHistory.filter(c => c.id !== chatId),
                    activeChat: state.activeChat?.id === chatId ? null : state.activeChat,
                }))

                // Also delete from disk
                const tapestryId = useTapestryStore.getState().activeTapestryId
                if (tapestryId) {
                    window.electron?.dmChat?.deleteChat(tapestryId, chatId)
                }
            },

            renameChat: (chatId: string, title: string) => {
                set(state => ({
                    chatHistory: state.chatHistory.map(c =>
                        c.id === chatId ? { ...c, title, updatedAt: new Date().toISOString() } : c
                    ),
                    activeChat: state.activeChat?.id === chatId
                        ? { ...state.activeChat, title, updatedAt: new Date().toISOString() }
                        : state.activeChat,
                }))
            },

            // ─────────────────────────────────────────────────────────────────────
            // Messaging
            // ─────────────────────────────────────────────────────────────────────

            sendMessage: async (content: string) => {
                const { activeChat, selectedPersonaId, precisionLevel, includeActivePanel } = get()

                if (!activeChat) {
                    get().newChat()
                }

                const chat = get().activeChat
                if (!chat) return

                // Get context if needed
                let contextPanelId: string | undefined
                let contextPanelTitle: string | undefined
                let contextContent: string | undefined

                if (includeActivePanel) {
                    const { useEditorStore } = await import('./useEditorStore')
                    const { activeEntryId, openEntries } = useEditorStore.getState()
                    const activeEntry = openEntries.find(e => e.id === activeEntryId)

                    if (activeEntry) {
                        contextPanelId = activeEntry.id
                        contextPanelTitle = activeEntry.title
                        contextContent = activeEntry.content
                    }
                }

                // Create user message
                const userMessage = createUserMessage(content, contextPanelId, contextPanelTitle)

                // Add to chat
                set(state => ({
                    activeChat: state.activeChat ? {
                        ...state.activeChat,
                        messages: [...state.activeChat.messages, userMessage],
                        updatedAt: new Date().toISOString(),
                    } : null,
                    isLoading: true,
                    error: null,
                }))

                try {
                    // Build prompt with persona and precision
                    const { buildDmChatPrompt } = await import('../lib/dmChat/promptBuilder')
                    const prompt = buildDmChatPrompt({
                        personaId: selectedPersonaId,
                        precisionLevel,
                        userMessage: content,
                        contextContent,
                        contextPanelTitle,
                        chatHistory: chat.messages,
                    })

                    // Call AI
                    const { callAi } = await import('../core/ai/aiClient')
                    const { settings } = useAiStore.getState()

                    if (!settings.uri || !settings.apiKey || !settings.model) {
                        throw new Error('AI not configured. Please check settings.')
                    }

                    // Cast messages to Any for compatibility if needed, or precise type match
                    const response = await callAi(
                        settings.uri,
                        settings.apiKey,
                        settings.model,
                        prompt as any
                    )

                    // Get persona name
                    const { getPersonaById } = await import('../core/ai/personaDefaults')
                    const persona = getPersonaById(selectedPersonaId as any)

                    // Create assistant message
                    const assistantMessage = createAssistantMessage(
                        response.content,
                        selectedPersonaId,
                        persona?.defaultName || 'DM',
                        precisionLevel
                    )

                    // Add to chat
                    set(state => ({
                        activeChat: state.activeChat ? {
                            ...state.activeChat,
                            messages: [...state.activeChat.messages, assistantMessage],
                            updatedAt: new Date().toISOString(),
                            lastPersonaId: selectedPersonaId,
                            lastPrecisionLevel: precisionLevel,
                        } : null,
                        isLoading: false,
                    }))

                    // Auto-save
                    get().saveCurrentChat()

                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to get response',
                    })
                }
            },

            regenerateLastResponse: async () => {
                const { activeChat } = get()
                if (!activeChat || activeChat.messages.length < 2) return

                // Find last user message
                const messages = [...activeChat.messages]
                let lastUserMessageIndex = -1

                for (let i = messages.length - 1; i >= 0; i--) {
                    if (messages[i].role === 'user') {
                        lastUserMessageIndex = i
                        break
                    }
                }

                if (lastUserMessageIndex === -1) return

                // Remove all messages after last user message
                const trimmedMessages = messages.slice(0, lastUserMessageIndex + 1)
                const lastUserMessage = trimmedMessages[trimmedMessages.length - 1]

                set(state => ({
                    activeChat: state.activeChat ? {
                        ...state.activeChat,
                        messages: trimmedMessages,
                    } : null,
                }))

                // Resend
                await get().sendMessage(lastUserMessage.content)
            },

            // ─────────────────────────────────────────────────────────────────────
            // Settings
            // ─────────────────────────────────────────────────────────────────────

            setPersona: (personaId: string) => {
                set({ selectedPersonaId: personaId })
            },

            setPrecision: (level: PrecisionLevel) => {
                set({ precisionLevel: level })
            },

            setIncludeActivePanel: (include: boolean) => {
                set({ includeActivePanel: include })
            },

            // ─────────────────────────────────────────────────────────────────────
            // UI
            // ─────────────────────────────────────────────────────────────────────

            toggleHistory: () => {
                set(state => ({ showHistory: !state.showHistory }))
            },

            // ─────────────────────────────────────────────────────────────────────
            // Output
            // ─────────────────────────────────────────────────────────────────────

            copyResponse: (messageId: string) => {
                const message = get().activeChat?.messages.find(m => m.id === messageId)
                if (message) {
                    navigator.clipboard.writeText(message.content)
                }
            },

            insertAsThread: async (messageId: string) => {
                const { activeChat, selectedPersonaId } = get()
                const message = activeChat?.messages.find(m => m.id === messageId)
                if (!message || message.role !== 'assistant') return

                const { getPersonaById } = await import('../core/ai/personaDefaults')
                const persona = getPersonaById(selectedPersonaId as any)

                const { logThread } = await import('../core/results/threadEngine')
                logThread({
                    header: `Interpretation: ${persona?.defaultName || 'DM'}`,
                    result: message.content,
                    content: '',
                    source: 'interpretation',
                    meta: {
                        personaId: selectedPersonaId as any,
                        fromDmChat: true,
                    },
                })
            },

            createPanelFromResponse: async (messageId: string) => {
                const message = get().activeChat?.messages.find(m => m.id === messageId)
                if (!message || message.role !== 'assistant') return

                // Open dialog to create panel with content pre-filled
                // const { useDialogStore } = await import('./useDialogStore')
                // useDialogStore.getState().openCreatePanelFromContent({
                //     content: message.content,
                //     suggestedTitle: '', // Could parse from content
                // })
                console.warn('createPanelFromResponse not implemented yet')
            },

            // ─────────────────────────────────────────────────────────────────────
            // Quick Actions
            // ─────────────────────────────────────────────────────────────────────

            executeQuickAction: async (action: QuickAction) => {
                if (action.requiresContext && !get().includeActivePanel) {
                    set({ includeActivePanel: true })
                }

                await get().sendMessage(action.prompt)
            },

            // ─────────────────────────────────────────────────────────────────────
            // Lifecycle
            // ─────────────────────────────────────────────────────────────────────

            loadChatsForTapestry: async (tapestryId: string) => {
                try {
                    const chats = await window.electron?.dmChat?.loadChats(tapestryId) || []
                    set({ chatHistory: chats, activeChat: null })
                } catch (error) {
                    console.error('Failed to load chats:', error)
                    set({ chatHistory: [] })
                }
            },

            saveCurrentChat: async () => {
                const { activeChat } = get()
                if (!activeChat || activeChat.messages.length === 0) return

                const tapestryId = useTapestryStore.getState().activeTapestryId
                console.log('[DmChatStore] saveCurrentChat: Saving chat...', { chatId: activeChat.id, tapestryId })

                if (!tapestryId) {
                    console.error('[DmChatStore] saveCurrentChat: No active tapestry ID')
                    return
                }

                // Update history
                set(state => {
                    const existingIndex = state.chatHistory.findIndex(c => c.id === activeChat.id)
                    const updatedHistory = existingIndex >= 0
                        ? state.chatHistory.map(c => c.id === activeChat.id ? activeChat : c)
                        : [...state.chatHistory, activeChat]

                    return { chatHistory: updatedHistory }
                })

                // Save to disk
                const success = await window.electron?.dmChat?.saveChat(tapestryId, activeChat)
                console.log('[DmChatStore] saveCurrentChat: Save result:', success)
            },
        }),
        {
            name: 'anvil-loom-dm-chat',
            partialize: (state) => ({
                selectedPersonaId: state.selectedPersonaId,
                precisionLevel: state.precisionLevel,
                includeActivePanel: state.includeActivePanel,
            }),
        }
    )
)
