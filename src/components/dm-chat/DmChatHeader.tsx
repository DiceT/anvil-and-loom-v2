import { Plus, History, X } from 'lucide-react'
import { useDmChatStore } from '../../stores/useDmChatStore'

export function DmChatHeader() {
    const { showHistory, newChat, toggleHistory } = useDmChatStore()

    return (
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-200">
                {showHistory ? 'Chat History' : 'DM Chat'}
            </h2>

            <div className="flex items-center gap-1">
                {!showHistory && (
                    <button
                        onClick={newChat}
                        className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                        title="New Chat"
                    >
                        <Plus className="w-4 h-4 text-slate-400" />
                    </button>
                )}

                <button
                    onClick={toggleHistory}
                    className={`p-1.5 rounded transition-colors ${showHistory
                        ? 'bg-purple-600 text-white'
                        : 'hover:bg-slate-700 text-slate-400'
                        }`}
                    title={showHistory ? 'Close History' : 'View History'}
                >
                    {showHistory ? (
                        <X className="w-4 h-4" />
                    ) : (
                        <History className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    )
}
