import { useMacroStore } from '../../stores/useMacroStore'
import { MacroSlot } from './MacroSlot'

export function MacroBar() {
    const { getVisibleSlots } = useMacroStore()
    const visibleSlots = getVisibleSlots()

    return (
        <div className="flex gap-2">
            {visibleSlots.map((slot, i) => (
                <MacroSlot
                    key={slot.id}
                    slot={slot}
                    visualIndex={i}  // 0-7 for keyboard shortcuts
                />
            ))}
        </div>
    )
}
