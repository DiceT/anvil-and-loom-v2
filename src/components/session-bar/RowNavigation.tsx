import { ChevronUp, ChevronDown } from 'lucide-react'
import { useMacroStore } from '../../stores/useMacroStore'
import { TOTAL_ROWS } from '../../types/macro'

export function RowNavigation() {
    const { visibleRow, nextRow, prevRow, setRow } = useMacroStore()

    return (
        <div className="flex items-center gap-2">
            {/* Row Indicator Dots (Vertical) */}
            <div className="flex flex-col gap-1">
                {Array.from({ length: TOTAL_ROWS }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setRow(i)}
                        className={`
              w-2 h-2 rounded-full
              transition-colors
              ${i === visibleRow
                                ? 'bg-purple-400'
                                : 'bg-slate-600 hover:bg-slate-500'
                            }
            `}
                    />
                ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col gap-1">
                {/* Up Arrow */}
                <button
                    onClick={prevRow}
                    className="
            w-8 h-7
            flex items-center justify-center
            rounded
            bg-slate-800 hover:bg-slate-700
            border border-slate-600
            transition-colors
          "
                >
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                </button>

                {/* Down Arrow */}
                <button
                    onClick={nextRow}
                    className="
            w-8 h-7
            flex items-center justify-center
            rounded
            bg-slate-800 hover:bg-slate-700
            border border-slate-600
            transition-colors
          "
                >
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    )
}
