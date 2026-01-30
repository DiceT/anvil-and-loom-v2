// ─────────────────────────────────────────────────────────────────────────────
// Session Input Bar
// 
// Chat-like input for adding content to a Live Session.
// Supports:
// - Plain text (creates user cards)
// - Slash commands (/roll, /oracle, /clock, etc.)
// - Quick-action buttons for common actions
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { createUserCard } from '../../utils/threadCardFactory';
import { Dices, Scroll, Clock, BarChart2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SessionInputBarProps {
    onCommand?: (command: string, args: string) => void;
    onDiceClick?: () => void;
    onOracleClick?: () => void;
    onClockClick?: () => void;
    onTrackClick?: () => void;
    placeholder?: string;
    className?: string;
}

interface SlashCommand {
    command: string;
    aliases: string[];
    description: string;
    example: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Slash Commands Definition
// ─────────────────────────────────────────────────────────────────────────────

const SLASH_COMMANDS: SlashCommand[] = [
    {
        command: 'roll',
        aliases: ['r', 'dice', 'd'],
        description: 'Roll dice',
        example: '/roll 2d6+1',
    },
    {
        command: 'oracle',
        aliases: ['o', 'table', 't'],
        description: 'Consult an oracle table',
        example: '/oracle Action',
    },
    {
        command: 'clock',
        aliases: ['c'],
        description: 'Create a progress clock',
        example: '/clock "Danger" 6',
    },
    {
        command: 'track',
        aliases: ['tr', 'progress'],
        description: 'Create a progress track',
        example: '/track "Investigation" 10 Dangerous',
    },
    {
        command: 'interpret',
        aliases: ['i', 'ai'],
        description: 'Get AI interpretation of recent events',
        example: '/interpret',
    },
    {
        command: 'note',
        aliases: ['n'],
        description: 'Add a note (same as plain text)',
        example: '/note This is important',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const SessionInputBar: React.FC<SessionInputBarProps> = ({
    onCommand,
    onDiceClick,
    onOracleClick,
    onClockClick,
    onTrackClick,
    placeholder = 'Type a message or /command...',
    className = '',
}) => {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { addCard, activeSessionId } = useSessionStore();

    // ─────────────────────────────────────────────────────────────────────────
    // Command Parsing
    // ─────────────────────────────────────────────────────────────────────────

    const parseInput = useCallback((text: string): { isCommand: boolean; command?: string; args?: string } => {
        const trimmed = text.trim();

        if (!trimmed.startsWith('/')) {
            return { isCommand: false };
        }

        const spaceIndex = trimmed.indexOf(' ');
        const command = spaceIndex === -1
            ? trimmed.slice(1).toLowerCase()
            : trimmed.slice(1, spaceIndex).toLowerCase();
        const args = spaceIndex === -1
            ? ''
            : trimmed.slice(spaceIndex + 1).trim();

        return { isCommand: true, command, args };
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Submission Handler
    // ─────────────────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed || !activeSessionId) return;

        const parsed = parseInput(trimmed);

        if (parsed.isCommand && parsed.command) {
            // Handle slash command
            onCommand?.(parsed.command, parsed.args || '');
        } else {
            // Create user card for plain text
            const card = createUserCard(activeSessionId, {
                input: trimmed,
                source: 'Player',
            });
            addCard(card);
        }

        setInput('');
        setShowSuggestions(false);
    }, [input, activeSessionId, parseInput, onCommand, addCard]);

    // ─────────────────────────────────────────────────────────────────────────
    // Keyboard Handler
    // ─────────────────────────────────────────────────────────────────────────

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
            return;
        }

        // Show suggestions when typing /
        if (e.key === '/' && input === '') {
            setShowSuggestions(true);
        }

        // Hide suggestions on Escape
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }, [handleSubmit, input]);

    // ─────────────────────────────────────────────────────────────────────────
    // Suggestion Filtering
    // ─────────────────────────────────────────────────────────────────────────

    const filteredSuggestions = useCallback(() => {
        if (!input.startsWith('/')) return [];

        const query = input.slice(1).toLowerCase();

        return SLASH_COMMANDS.filter(cmd =>
            cmd.command.startsWith(query) ||
            cmd.aliases.some(a => a.startsWith(query))
        );
    }, [input]);

    const suggestions = showSuggestions ? filteredSuggestions() : [];

    // ─────────────────────────────────────────────────────────────────────────
    // Suggestion Selection
    // ─────────────────────────────────────────────────────────────────────────

    const selectSuggestion = useCallback((cmd: SlashCommand) => {
        setInput(`/${cmd.command} `);
        setShowSuggestions(false);
        inputRef.current?.focus();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className={`relative ${className}`}>
            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden z-20">
                    {suggestions.map(cmd => (
                        <button
                            key={cmd.command}
                            onClick={() => selectSuggestion(cmd)}
                            className="w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-200">
                                    /{cmd.command}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {cmd.description}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                {cmd.example}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-2 p-3 bg-slate-800 border-t border-slate-700">
                {/* Text Input */}
                <div className="flex-1 relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setShowSuggestions(e.target.value.startsWith('/'));
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => input.startsWith('/') && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder={placeholder}
                        rows={1}
                        className="
              w-full px-3 py-2
              bg-slate-900 border border-slate-700 rounded-lg
              text-sm text-slate-100 placeholder-slate-500
              resize-none
              focus:outline-none focus:border-slate-500
            "
                        style={{
                            minHeight: '40px',
                            maxHeight: '120px',
                        }}
                    />
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1">
                    {onDiceClick && (
                        <button
                            onClick={onDiceClick}
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                            title="Roll Dice"
                        >
                            <Dices size={18} />
                        </button>
                    )}
                    {onOracleClick && (
                        <button
                            onClick={onOracleClick}
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                            title="Consult Oracle"
                        >
                            <Scroll size={18} />
                        </button>
                    )}
                    {onClockClick && (
                        <button
                            onClick={onClockClick}
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                            title="Create Clock"
                        >
                            <Clock size={18} />
                        </button>
                    )}
                    {onTrackClick && (
                        <button
                            onClick={onTrackClick}
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                            title="Create Track"
                        >
                            <BarChart2 size={18} />
                        </button>
                    )}
                </div>

                {/* Send Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!input.trim()}
                    className="
            px-4 py-2
            bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700
            text-white text-sm font-medium
            rounded-lg transition-colors
            disabled:cursor-not-allowed disabled:text-slate-500
            h-[40px]
          "
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default SessionInputBar;
