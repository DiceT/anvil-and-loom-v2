import * as Icons from 'lucide-react'
import { useDmChatStore } from '../../stores/useDmChatStore'
import { DEFAULT_QUICK_ACTIONS } from '../../types/dmChat'

export function DmChatQuickActions() {
    const { executeQuickAction, isLoading, includeActivePanel } = useDmChatStore()

    return (
        <div className="px-3 py-2 border-t border-slate-700">
            <div className="flex flex-wrap gap-1">
                {DEFAULT_QUICK_ACTIONS.map((action) => {
                    const Icon = Icons[action.icon as keyof typeof Icons] as Icons.LucideIcon
                    const disabled = isLoading || (action.requiresContext && !includeActivePanel)

                    return (
                        <button
                            key={action.id}
                            onClick={() => executeQuickAction(action)}
                            disabled={disabled}
                            className={`
                flex items-center gap-1 px-2 py-1 rounded text-xs
                transition-colors
                ${disabled
                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                }
              `}
                            title={action.requiresContext && !includeActivePanel
                                ? 'Enable "Include Active Panel" to use this'
                                : action.prompt
                            }
                        >
                            {Icon && <Icon className="w-3 h-3" />}
                            {action.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
