import { useDifficultyStore } from '../../stores/useDifficultyStore'
import { CheckCircle2, Circle } from 'lucide-react'

export function TargetNumberDisplay() {
    const { targetNumber, isEnabled, setTargetNumber, toggleEnabled } = useDifficultyStore()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value)
        if (!isNaN(val)) {
            setTargetNumber(val)
        }
    }

    return (
        <div className="flex items-center gap-2 bg-slate-950/50 rounded-lg px-2 py-1 border border-slate-700/50 h-[64px] w-[110px]">
            {/* Toggle (Light) */}
            <button
                onClick={toggleEnabled}
                className={`
                    flex flex-col items-center justify-center gap-1
                    outline-none transition-all
                `}
                title="Toggle Target Difficulty"
            >
                <div className={`
                    w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]
                    ${isEnabled ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}
                `} />
                <span className={`text-[10px] font-bold ${isEnabled ? 'text-cyan-400' : 'text-slate-600'}`}>
                    DC
                </span>
            </button>

            {/* Target Number Display/Input */}
            <div className={`relative flex flex-col items-center justify-center transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-50'}`}>
                <input
                    type="number"
                    value={targetNumber}
                    onChange={handleInputChange}
                    className="
                        w-full bg-transparent text-center text-3xl font-bold text-white
                        focus:outline-none focus:ring-0
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    "
                />
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Target</span>
            </div>
        </div>
    )
}
