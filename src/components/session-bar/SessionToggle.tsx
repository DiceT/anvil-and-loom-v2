import { useSessionLifecycle } from '../../hooks/useSessionLifecycle'

export function SessionToggle() {
    const { startSession, endSession, isActive } = useSessionLifecycle()
    // Removed createEntry usage since useSessionLifecycle handles file creation

    const handleStart = async () => {
        // useSessionLifecycle handles everything now
        await startSession();
    }

    const handleEnd = async () => {
        await endSession()
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
                    ? 'border-error bg-error/10 hover:bg-error/20'
                    : 'border-success bg-success/10 hover:bg-success/20'
                }
      `}
        >
            {/* Indicator Light */}
            <div
                className={`
          w-3 h-3 rounded-full
          ${isActive
                        ? 'bg-error shadow-[0_0_8px_2px_rgba(207,123,123,0.5)] animate-pulse'
                        : 'bg-success shadow-[0_0_8px_2px_rgba(126,201,162,0.5)]'
                    }
        `}
            />

            {/* Label */}
            <span className={`text-xs font-medium uppercase tracking-wider ${isActive ? 'text-error' : 'text-success'}`}>
                {isActive ? 'End' : 'Start'}
            </span>
        </button>
    )
}
