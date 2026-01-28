import { ChatMessage, PrecisionLevel, PRECISION_INSTRUCTIONS } from '../../types/dmChat'
import { getPersonaById } from '../../core/ai/personaDefaults'

interface BuildPromptParams {
    personaId: string
    precisionLevel: PrecisionLevel
    userMessage: string
    contextContent?: string
    contextPanelTitle?: string
    chatHistory: ChatMessage[]
}

export function buildDmChatPrompt(params: BuildPromptParams): { role: 'system' | 'user' | 'assistant'; content: string }[] {
    const {
        personaId,
        precisionLevel,
        userMessage,
        contextContent,
        contextPanelTitle,
        chatHistory,
    } = params

    const persona = getPersonaById(personaId as any)
    const precisionInstruction = PRECISION_INSTRUCTIONS[precisionLevel]

    // Build system prompt
    let systemPrompt = ''

    // Persona instructions
    if (persona?.defaultInstructions) {
        systemPrompt += persona.defaultInstructions + '\n\n'
    }

    // Precision instructions
    systemPrompt += `Response Style: ${precisionInstruction}\n\n`

    // Context
    if (contextContent && contextPanelTitle) {
        systemPrompt += `
The user is currently viewing a panel titled "${contextPanelTitle}".
Here is its content for context:

<panel_content>
${contextContent}
</panel_content>

Use this context to inform your responses when relevant.
`
    }

    // Build messages array for API
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []

    // Add system prompt
    if (systemPrompt) {
        messages.push({
            role: 'system',
            content: systemPrompt
        })
    }

    // Add recent chat history (last 10 messages for context)
    const recentHistory = chatHistory.slice(-10)
    for (const msg of recentHistory) {
        messages.push({
            role: msg.role,
            content: msg.content,
        })
    }

    // Add current message
    messages.push({
        role: 'user',
        content: userMessage,
    })

    return messages
}
