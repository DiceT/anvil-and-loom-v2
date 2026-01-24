import { useState, useRef } from 'react'
import { Send, Mic } from 'lucide-react'
import { logThread } from '../../core/results/threadEngine'

export function SessionChatInput() {
    const [message, setMessage] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!message.trim()) return

        // Log as user Thread
        logThread({
            header: 'User',
            result: message.trim(),
            content: '',
            source: 'user',
        })

        setMessage('')
        inputRef.current?.focus()
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {/* Mic Button - Placeholder for future function */}
            <button
                type="button"
                className="
          w-10 h-10
          flex items-center justify-center
          rounded-lg
          bg-slate-800 hover:bg-slate-700
          border border-slate-600
          transition-colors
        "
            >
                <Mic className="w-4 h-4 text-slate-400" />
            </button>

            {/* Input */}
            <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message the session log..."
                className="
          flex-1
          h-10
          px-4
          bg-slate-800
          border border-slate-600
          rounded-lg
          text-sm text-slate-200
          placeholder:text-slate-500
          focus:outline-none focus:border-purple-500
        "
            />

            {/* Send Button */}
            <button
                type="submit"
                disabled={!message.trim()}
                className="
          w-10 h-10
          flex items-center justify-center
          rounded-lg
          bg-purple-600 hover:bg-purple-700
          disabled:bg-slate-700 disabled:cursor-not-allowed
          transition-colors
        "
            >
                <Send className="w-4 h-4 text-white" />
            </button>
        </form>
    )
}
