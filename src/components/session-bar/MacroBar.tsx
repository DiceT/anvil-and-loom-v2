import { useMacroStore } from '../../stores/useMacroStore'
import { MacroSlot } from './MacroSlot'
import { ClockButton } from './ClockButton'
import { TrackButton } from './TrackButton'
import { SessionToggle } from './SessionToggle'

export function MacroBar() {
    const { getVisibleSlots } = useMacroStore()
    const visibleSlots = getVisibleSlots()

    return (
        <div className="flex items-center gap-2">
            {/* Session Controls */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-700 mr-2">
                <SessionToggle />
                <ClockButton />
                <TrackButton />
            </div>

            {/* Macro Slots */}
            <div className="flex gap-2">
                {visibleSlots.map((slot, i) => (
                    <MacroSlot
                        key={slot.id}
                        slot={slot}
                        visualIndex={i}  // 0-7 for keyboard shortcuts
                    />
                ))}
            </div>
        </div>
    )
}
