import { useEffect } from 'react'
import { useDmChatStore } from '../../stores/useDmChatStore'
import { useTapestryStore } from '../../stores/useTapestryStore'
import { DmChatHeader } from './DmChatHeader'
import { DmChatSettings } from './DmChatSettings'
import { DmChatMessages } from './DmChatMessages'
import { DmChatInput } from './DmChatInput'
import { DmChatQuickActions } from './DmChatQuickActions'
import { DmChatHistory } from './DmChatHistory'

export function DmChatPanel() {
    const { activeTapestryConfig } = useTapestryStore()
    const {
        activeChat,
        showHistory,
        loadChatsForTapestry,
        newChat,
    } = useDmChatStore()

    // Load chats when tapestry changes
    useEffect(() => {
        if (activeTapestryConfig?.id) {
            loadChatsForTapestry(activeTapestryConfig.id)
        }
    }, [activeTapestryConfig?.id, loadChatsForTapestry])

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <DmChatHeader />

            {/* Settings Bar */}
            <DmChatSettings />

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {showHistory ? (
                    <DmChatHistory />
                ) : activeChat ? (
                    <DmChatMessages />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <button
                            onClick={newChat}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
                        >
                            Start New Chat
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            {!showHistory && <DmChatQuickActions />}

            {/* Input */}
            {!showHistory && <DmChatInput />}
        </div>
    )
}
