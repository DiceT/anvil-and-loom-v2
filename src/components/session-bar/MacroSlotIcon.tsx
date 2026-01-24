import {
    Dices,
    Table,
    Link,
    Sparkles,
    Clock,
    TrendingUp
} from 'lucide-react'
import { MacroType } from '../../types/macro'

interface MacroSlotIconProps {
    type: MacroType
}

const iconMap: Record<MacroType, { icon: typeof Dices; color: string }> = {
    dice: { icon: Dices, color: 'text-amber-400' },
    table: { icon: Table, color: 'text-cyan-400' },
    panel: { icon: Link, color: 'text-purple-400' },
    oracle: { icon: Sparkles, color: 'text-violet-400' },
    clock: { icon: Clock, color: 'text-yellow-400' },
    track: { icon: TrendingUp, color: 'text-emerald-400' },
    empty: { icon: Dices, color: 'text-slate-600' },
}

export function MacroSlotIcon({ type }: MacroSlotIconProps) {
    const { icon: Icon, color } = iconMap[type]

    return <Icon className={`w-5 h-5 ${color}`} />
}
