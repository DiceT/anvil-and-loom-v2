import { useEffect, useRef } from 'react'
import { useDmChatStore } from '../../stores/useDmChatStore'
import { DmChatMessage } from './DmChatMessage'

export function DmChatMessages() {
    const { activeChat, isLoading } = useDmChatStore()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [activeChat?.messages.length])

    if (!activeChat) return null

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 app-scroll">
            {activeChat.messages.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">
                    Start a conversation with your DM...
                </div>
            ) : (
                activeChat.messages.map((message) => (
                    <DmChatMessage key={message.id} message={message} />
                ))
            )}

            {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span>Thinking...</span>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    )
}
