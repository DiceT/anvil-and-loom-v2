import { Search } from 'lucide-react'
import { useState } from 'react'
import { useDmChatStore } from '../../stores/useDmChatStore'
import { DmChatHistoryItem } from './DmChatHistoryItem'

export function DmChatHistory() {
    const { chatHistory } = useDmChatStore()
    const [search, setSearch] = useState('')

    const filteredChats = chatHistory.filter((chat) =>
        chat.title.toLowerCase().includes(search.toLowerCase()) ||
        chat.messages.some((m) =>
            m.content.toLowerCase().includes(search.toLowerCase())
        )
    )

    return (
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className="p-3 border-b border-slate-700">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search chats..."
                        className="w-full bg-slate-800 border border-slate-600 rounded pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto app-scroll">
                {filteredChats.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm py-8">
                        {search ? 'No chats found' : 'No chat history yet'}
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <DmChatHistoryItem key={chat.id} chat={chat} />
                    ))
                )}
            </div>
        </div>
    )
}
