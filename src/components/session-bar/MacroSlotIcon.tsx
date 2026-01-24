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
    dice: { icon: Dices, color: 'text-gold' },
    table: { icon: Table, color: 'text-amethyst' },
    panel: { icon: Link, color: 'text-sapphire' }, // Links/System -> Sapphire
    oracle: { icon: Sparkles, color: 'text-ruby' }, // Magic/AI/Interpretation -> Ruby (or Amethyst if tables) - Philosophy says Ruby for AI/Magic. But Oracle combines tables. Let's use Amethyst for Consistency with tables? Or Ruby for "Sparkles". Philosophy line 22: "Amethyst - Oracle, tables". So Amethyst.
    clock: { icon: Clock, color: 'text-copper' },
    track: { icon: TrendingUp, color: 'text-jade' },
    empty: { icon: Dices, color: 'text-type-tertiary' },
}

export function MacroSlotIcon({ type }: MacroSlotIconProps) {
    const { icon: Icon, color } = iconMap[type]

    return <Icon className={`w-5 h-5 ${color}`} />
}
