// ─────────────────────────────────────────────────────────────────────────────
// Precision Levels
// ─────────────────────────────────────────────────────────────────────────────

export type PrecisionLevel = 1 | 2 | 3 | 4 | 5

export const PRECISION_LABELS: Record<PrecisionLevel, string> = {
    1: 'Very Concise',
    2: 'Concise',
    3: 'Balanced',
    4: 'Detailed',
    5: 'Very Detailed',
}

export const PRECISION_INSTRUCTIONS: Record<PrecisionLevel, string> = {
    1: 'Respond in 1-2 sentences maximum. Be terse.',
    2: 'Respond in 2-3 sentences. Be brief but complete.',
    3: 'Respond in a short paragraph. Balance detail with brevity.',
    4: 'Respond with full detail. Multiple paragraphs are fine.',
    5: 'Respond with rich, elaborate detail. Take your time.',
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Message
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string

    // Context at time of message
    personaId?: string
    personaName?: string
    precisionLevel?: PrecisionLevel
    contextPanelId?: string
    contextPanelTitle?: string

    // For assistant messages
    isRegenerating?: boolean
    regenerationOf?: string  // ID of message this regenerated
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────────────────────────────────────

export interface Chat {
    id: string
    title: string
    messages: ChatMessage[]
    createdAt: string
    updatedAt: string
    tapestryId: string

    // Last used settings (restored when chat reopened)
    lastPersonaId?: string
    lastPrecisionLevel?: PrecisionLevel
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Action Templates
// ─────────────────────────────────────────────────────────────────────────────

export interface QuickAction {
    id: string
    label: string
    icon: string  // Lucide icon name
    prompt: string
    requiresContext: boolean  // Does this need active panel?
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'describe',
        label: 'Describe',
        icon: 'Eye',
        prompt: 'Describe this place. What do I see, hear, smell, and feel when I enter?',
        requiresContext: true,
    },
    {
        id: 'wants',
        label: 'Wants?',
        icon: 'Target',
        prompt: 'What does this character want right now? What is their immediate goal and their deeper motivation?',
        requiresContext: true,
    },
    {
        id: 'interpret',
        label: 'Interpret',
        icon: 'Sparkles',
        prompt: 'Interpret the most recent oracle result or dice roll in the context of the current scene.',
        requiresContext: true,
    },
    {
        id: 'complicate',
        label: 'Complicate',
        icon: 'AlertTriangle',
        prompt: 'Introduce a complication or twist that makes the current situation more interesting or dangerous.',
        requiresContext: true,
    },
    {
        id: 'next',
        label: 'What Next?',
        icon: 'ArrowRight',
        prompt: 'Based on what has happened, what happens next? What is the natural consequence or development?',
        requiresContext: true,
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

export function createChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function createMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function createChat(tapestryId: string): Chat {
    return {
        id: createChatId(),
        title: `Chat ${new Date().toLocaleDateString()}`,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tapestryId,
        lastPrecisionLevel: 3,
    }
}

export function createUserMessage(
    content: string,
    contextPanelId?: string,
    contextPanelTitle?: string
): ChatMessage {
    return {
        id: createMessageId(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        contextPanelId,
        contextPanelTitle,
    }
}

export function createAssistantMessage(
    content: string,
    personaId: string,
    personaName: string,
    precisionLevel: PrecisionLevel,
    regenerationOf?: string
): ChatMessage {
    return {
        id: createMessageId(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        personaId,
        personaName,
        precisionLevel,
        regenerationOf,
    }
}
