import { useState, useRef } from 'react'
import { Send, Mic } from 'lucide-react'
import { useSessionActions } from '../../hooks/useSessionActions'

export function SessionChatInput() {
    const [message, setMessage] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const { dispatch, openDiceModal, openOracleModal, openClockModal, openTrackModal } = useSessionActions();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const text = message.trim();
        if (!text) return;

        // Slash Command Parsing
        if (text.startsWith('/')) {
            const [command, ...argsParts] = text.slice(1).split(' ');
            const args = argsParts.join(' ');

            switch (command.toLowerCase()) {
                case 'roll':
                case 'r':
                    await dispatch('dice.roll', { expression: args || '1d20' });
                    break;
                case 'oracle':
                case 'o':
                case 'table':
                case 't':
                    if (args) {
                        await dispatch('oracle.query', { tableName: args });
                    } else {
                        openOracleModal();
                    }
                    break;
                case 'clock':
                case 'c':
                    // format: /clock "Name" segments
                    const cMatch = args.match(/"([^"]+)"\s+(\d+)/);
                    if (cMatch) {
                        await dispatch('clock.create', { name: cMatch[1], segments: parseInt(cMatch[2]) });
                    } else {
                        // If parsing fails or no args, open modal or show error
                        // For now we assume no-args means open modal if supported?
                        // Or just log error
                        if (!args) openClockModal();
                        else console.warn('Invalid clock format. Use: /clock "Name" segments');
                    }
                    break;
                case 'track':
                case 'tr':
                    // format: /track "Name" segments [difficulty]
                    const tMatch = args.match(/"([^"]+)"\s+(\d+)\s*(\w*)/);
                    if (tMatch) {
                        await dispatch('track.create', {
                            name: tMatch[1],
                            segments: parseInt(tMatch[2]),
                            difficulty: tMatch[3] || undefined
                        });
                    } else {
                        if (!args) openTrackModal();
                        else console.warn('Invalid track format. Use: /track "Name" segments [difficulty]');
                    }
                    break;
                case 'ai':
                case 'interpret':
                case 'i':
                    await dispatch('ai.interpret', {});
                    break;
                default:
                    // Treat unknown commands as generic or ignore? 
                    // For now, if unknown, maybe just log as user text but warn?
                    // Better to just log as user text if it doesn't match known commands?
                    // No, invalid command should probably feedback.
                    console.warn('Unknown command:', command);
                    // Fallback to user message for now so we don't lose data
                    await dispatch('thread.create', { type: 'user', content: text });
            }
        } else {
            // Standard User Message
            await dispatch('thread.create', { type: 'user', content: text });
        }

        setMessage('')
        inputRef.current?.focus()
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
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
                placeholder="Message or /roll, /oracle..."
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
