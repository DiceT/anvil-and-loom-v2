import { Copy, RefreshCw, Plus, FileText } from 'lucide-react'
import { ChatMessage } from '../../types/dmChat'
import { useDmChatStore } from '../../stores/useDmChatStore'

interface DmChatMessageProps {
    message: ChatMessage
}

export function DmChatMessage({ message }: DmChatMessageProps) {
    const {
        copyResponse,
        regenerateLastResponse,
        insertAsThread,
        createPanelFromResponse,
        activeChat,
    } = useDmChatStore()

    const isUser = message.role === 'user'
    const isLastAssistant =
        !isUser &&
        activeChat?.messages[activeChat.messages.length - 1]?.id === message.id

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            {/* Message Bubble */}
            <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${isUser
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 border border-slate-700 text-slate-200'
                    }`}
            >
                {/* Persona Name for Assistant */}
                {!isUser && message.personaName && (
                    <div className="text-xs text-purple-400 font-medium mb-1">
                        {message.personaName}
                    </div>
                )}

                {/* Content */}
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                {/* Context Indicator */}
                {message.contextPanelTitle && (
                    <div className="text-xs text-slate-500 mt-1">
                        Context: {message.contextPanelTitle}
                    </div>
                )}
            </div>

            {/* Actions for Assistant Messages */}
            {!isUser && (
                <div className="flex items-center gap-1 mt-1">
                    <button
                        onClick={() => copyResponse(message.id)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300"
                        title="Copy"
                    >
                        <Copy className="w-3 h-3" />
                    </button>

                    {isLastAssistant && (
                        <button
                            onClick={regenerateLastResponse}
                            className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300"
                            title="Regenerate"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    )}

                    <button
                        onClick={() => insertAsThread(message.id)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300"
                        title="Insert as Thread"
                    >
                        <Plus className="w-3 h-3" />
                    </button>

                    <button
                        onClick={() => createPanelFromResponse(message.id)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300"
                        title="Create Panel"
                    >
                        <FileText className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Timestamp */}
            <div className="text-[10px] text-slate-600 mt-0.5">
                {new Date(message.timestamp).toLocaleTimeString()}
            </div>
        </div>
    )
}
