import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { SpeechButton } from './SpeechButton';
import { useSessionStore } from '../../stores/useSessionStore';
import { logThread } from '../../core/results/threadEngine';

export function SessionInput() {
    const { activeSessionId } = useSessionStore();
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !activeSessionId) return;

        // Log to Thread Engine
        logThread({
            header: 'User', // TODO: Make this configurable (Player Name)
            result: input.trim(),
            content: input.trim(),
            source: 'user', // Changed from 'chat' to 'user'
            meta: {
                type: 'chat'
            }
        });

        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleVoiceInput = (text: string) => {
        // Append voice text to current input
        setInput(prev => {
            const separator = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + text;
        });
    };

    if (!activeSessionId) return null;

    return (
        <div className="border-t border-slate-800 bg-slate-900 p-4">
            <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-end gap-2 bg-slate-800/50 rounded-lg p-2 border border-slate-700 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">

                <SpeechButton onTranscript={handleVoiceInput} />

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message the session log..."
                    className="flex-1 bg-transparent border-none text-slate-200 placeholder-slate-500 resize-none max-h-[200px] py-2 focus:ring-0 text-sm"
                    rows={1}
                />

                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
