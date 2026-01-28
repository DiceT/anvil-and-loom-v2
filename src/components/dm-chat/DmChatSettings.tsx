import { useDmChatStore } from '../../stores/useDmChatStore'
import { useAiStore } from '../../stores/useAiStore'
import { PRECISION_LABELS, PrecisionLevel } from '../../types/dmChat'
import { getAllPersonas } from '../../core/ai/personaDefaults'

export function DmChatSettings() {
    const {
        selectedPersonaId,
        precisionLevel,
        includeActivePanel,
        setPersona,
        setPrecision,
        setIncludeActivePanel,
        showHistory,
    } = useDmChatStore()

    const { getEffectivePersona } = useAiStore()
    const personas = getAllPersonas().map(p => getEffectivePersona(p.id))

    if (showHistory) return null

    return (
        <div className="px-3 py-2 border-b border-slate-700 space-y-2">
            {/* Persona Selector */}
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 w-16">Persona</label>
                <select
                    value={selectedPersonaId}
                    onChange={(e) => setPersona(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                >
                    {personas.map((persona) => (
                        <option key={persona.id} value={persona.id}>
                            {persona.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Precision Selector */}
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 w-16">Precision</label>
                <div className="flex-1 flex items-center gap-1">
                    {([1, 2, 3, 4, 5] as PrecisionLevel[]).map((level) => (
                        <button
                            key={level}
                            onClick={() => setPrecision(level)}
                            className={`w-6 h-6 rounded text-xs font-medium transition-colors ${precisionLevel === level
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                            title={PRECISION_LABELS[level]}
                        >
                            {level}
                        </button>
                    ))}
                    <span className="ml-2 text-xs text-slate-500">
                        {PRECISION_LABELS[precisionLevel]}
                    </span>
                </div>
            </div>

            {/* Include Active Panel */}
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 w-16">Context</label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeActivePanel}
                        onChange={(e) => setIncludeActivePanel(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs text-slate-300">Include Active Panel</span>
                </label>
            </div>
        </div>
    )
}
