import { useState, useRef, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { useDmChatStore } from '../../stores/useDmChatStore'

export function DmChatInput() {
    const [message, setMessage] = useState('')
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const { sendMessage, isLoading, newChat, activeChat } = useDmChatStore()

    const handleSubmit = async () => {
        if (!message.trim() || isLoading) return

        // Create new chat if none exists
        if (!activeChat) {
            newChat()
        }

        const content = message.trim()
        setMessage('')
        await sendMessage(content)

        inputRef.current?.focus()
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="p-3 border-t border-slate-700">
            <div className="flex items-end gap-2">
                <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message the DM..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                />

                <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || isLoading}
                    className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                    <Send className="w-4 h-4 text-white" />
                </button>
            </div>
        </div>
    )
}
