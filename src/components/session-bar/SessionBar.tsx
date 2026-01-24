import { useSessionStore } from '../../stores/useSessionStore'
import { SessionToggle } from './SessionToggle'
import { MacroBar } from './MacroBar'
import { RowNavigation } from './RowNavigation'
import { SessionChatInput } from './SessionChatInput'
import { TargetNumberDisplay } from './TargetNumberDisplay'

export function SessionBar() {
    const { activeSessionId } = useSessionStore()
    const isSessionActive = !!activeSessionId

    return (
        <div className="border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm p-3">
            {/* Top row: Session toggle + Macros + Navigation + DC */}
            <div className="flex items-center justify-center gap-4">
                {/* Session Toggle */}
                <SessionToggle />

                {/* Macro Slots */}
                <MacroBar />

                {/* Row Navigation */}
                <RowNavigation />

                {/* Target Difficulty */}
                <TargetNumberDisplay />
            </div>

            {/* Chat Input - appears when session active */}
            {isSessionActive && (
                <div className="mt-3">
                    <SessionChatInput />
                </div>
            )}
        </div>
    )
}
