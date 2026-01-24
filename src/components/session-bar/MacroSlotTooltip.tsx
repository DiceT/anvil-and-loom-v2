import { MacroSlot } from '../../types/macro'

interface MacroSlotTooltipProps {
    slot: MacroSlot
}

export function MacroSlotTooltip({ slot }: MacroSlotTooltipProps) {
    const getTooltipContent = () => {
        switch (slot.type) {
            case 'dice':
                return {
                    title: 'Roll Dice',
                    detail: slot.diceExpression,
                }
            case 'table':
                return {
                    title: 'Roll Table',
                    detail: slot.tableName,
                }
            case 'panel':
                return {
                    title: 'Open Panel',
                    detail: slot.panelTitle,
                }
            case 'oracle':
                return {
                    title: 'Roll Oracle',
                    detail: slot.oracleName,
                }
            case 'clock':
                return {
                    title: 'Tick Clock',
                    detail: slot.clockName,
                }
            case 'track':
                return {
                    title: 'Advance Track',
                    detail: slot.trackName,
                }
            default:
                return { title: '', detail: '' }
        }
    }

    const { title, detail } = getTooltipContent()

    return (
        <div className="
      absolute bottom-full left-1/2 -translate-x-1/2 mb-2
      px-3 py-2
      bg-slate-800 border border-slate-600 rounded-lg
      shadow-lg
      z-50
      whitespace-nowrap
      pointer-events-none
    ">
            <div className="text-xs font-medium text-slate-400">{title}</div>
            <div className="text-sm text-slate-200">{detail}</div>

            {/* Arrow */}
            <div className="
        absolute top-full left-1/2 -translate-x-1/2
        border-4 border-transparent border-t-slate-600
      " />
        </div>
    )
}
