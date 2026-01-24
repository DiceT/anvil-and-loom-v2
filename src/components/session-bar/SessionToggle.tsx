import { useSessionStore } from '../../stores/useSessionStore'
import { useEditorStore } from '../../stores/useEditorStore'
import { useTapestryStore } from '../../stores/useTapestryStore'

export function SessionToggle() {
    const { activeSessionId, startSession, endSession } = useSessionStore()
    const { openEntry } = useEditorStore()
    const { createEntry } = useTapestryStore()

    const isActive = !!activeSessionId

    const handleStart = async () => {
        // Create new session panel
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
        const title = `Session - ${timestamp}`

        // Create entry and open it
        const { path, id } = await createEntry(title, 'session')
        await openEntry(path)
        startSession(id)
    }

    const handleEnd = () => {
        endSession()
    }

    return (
        <button
            onClick={isActive ? handleEnd : handleStart}
            className={`
        relative
        w-16 h-16
        flex flex-col items-center justify-center gap-1
        rounded-lg
        border-2
        transition-all duration-200
        ${isActive
                    ? 'border-red-500 hover:bg-red-500/20'
                    : 'border-emerald-500 hover:bg-emerald-500/20'
                }
        bg-slate-800
      `}
        >
            {/* Indicator Light */}
            <div
                className={`
          w-3 h-3 rounded-full
          ${isActive
                        ? 'bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.5)] animate-pulse'
                        : 'bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]'
                    }
        `}
            />

            {/* Label */}
            <span className="text-xs font-medium text-slate-200 uppercase tracking-wider">
                {isActive ? 'End' : 'Start'}
            </span>
        </button>
    )
}
