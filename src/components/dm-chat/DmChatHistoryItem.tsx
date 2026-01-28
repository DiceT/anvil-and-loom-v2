import { Trash2, MessageSquare } from 'lucide-react'
import { Chat } from '../../types/dmChat'
import { useDmChatStore } from '../../stores/useDmChatStore'

interface DmChatHistoryItemProps {
    chat: Chat
}

export function DmChatHistoryItem({ chat }: DmChatHistoryItemProps) {
    const { loadChat, deleteChat } = useDmChatStore()

    const messageCount = chat.messages.length
    const lastMessage = chat.messages[chat.messages.length - 1]
    const preview = lastMessage?.content.slice(0, 60) || 'No messages'

    return (
        <div
            className="flex items-start gap-2 p-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer group"
            onClick={() => loadChat(chat.id)}
        >
            <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">
                        {chat.title}
                    </span>
                    <span className="text-[10px] text-slate-600 flex-shrink-0">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                    </span>
                </div>

                <div className="text-xs text-slate-500 truncate mt-0.5">
                    {preview}...
                </div>

                <div className="text-[10px] text-slate-600 mt-1">
                    {messageCount} message{messageCount !== 1 ? 's' : ''}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Delete this chat?')) {
                        deleteChat(chat.id)
                    }
                }}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded transition-all"
            >
                <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-400" />
            </button>
        </div>
    )
}
