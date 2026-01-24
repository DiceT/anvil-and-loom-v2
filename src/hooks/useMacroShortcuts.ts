import { useEffect } from 'react'
import { useMacroStore } from '../stores/useMacroStore'
import { executeMacro } from '../lib/macro/executeMacro'

export function useMacroShortcuts() {
    const { getVisibleSlots } = useMacroStore()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if not typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return
            }

            // Check for number keys 1-8
            const key = parseInt(e.key)
            if (key >= 1 && key <= 8) {
                // e.preventDefault() // Maybe don't block normal typing? But we checked for input elements.

                const slots = getVisibleSlots()
                const slot = slots[key - 1]
                if (slot && slot.type !== 'empty') {
                    // Need to prevent default if it's a valid macro, to avoid page actions if any
                    e.preventDefault()
                    executeMacro(slot)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [getVisibleSlots])
}
