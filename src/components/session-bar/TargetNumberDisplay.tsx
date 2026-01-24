import { useDifficultyStore } from '../../stores/useDifficultyStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { diceEngine } from '../../integrations/anvil-dice-app';
import { Dices } from 'lucide-react';

export function TargetNumberDisplay() {
    const {
        targetNumber, isEnabled, actionBonus,
        setTargetNumber, setActionBonus, toggleEnabled
    } = useDifficultyStore();

    const { settings } = useSettingsStore();
    const mode = settings.mechanics?.resolutionMethod || 'dc-2';

    const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) setTargetNumber(val);
    };

    const handleBonusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) setActionBonus(val);
    };

    const handleActionRoll = () => {
        // Roll Action: 1d6 (Action) + 2d10 (Challenge)
        // Note: Bonus is handled in logic, not in dice expression to avoid parser confusion.
        const expression = `1d6+2d10`;
        diceEngine.roll(expression, {
            meta: {
                resolution: 'action-roll',
                actionBonus: actionBonus
            }
        });
    };

    // --- Renderers ---

    if (mode === 'action-roll') {
        return (
            <div className="flex items-center gap-2 bg-canvas-panel rounded-lg px-2 py-1 border border-border h-[64px] w-[110px]">
                {/* Roll Button */}
                <button
                    onClick={handleActionRoll}
                    className="
                        flex flex-col items-center justify-center gap-1
                        outline-none transition-all group
                    "
                    title="Roll Action (d6 + Bonus vs 2d10)"
                >
                    <div className="
                        w-8 h-8 rounded-full bg-canvas-surface border border-border flex items-center justify-center
                        shadow-[0_0_8px_rgba(0,0,0,0.5)] group-hover:bg-gold/10 group-hover:border-gold/50 group-active:scale-95 transition-all
                    ">
                        <Dices className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-[10px] font-bold text-gold">
                        ROLL
                    </span>
                </button>

                {/* Bonus Input */}
                <div className="relative flex flex-col items-center justify-center">
                    <input
                        type="number"
                        value={actionBonus}
                        onChange={handleBonusChange}
                        className="
                            w-full bg-transparent text-center text-3xl font-bold text-gold
                            focus:outline-none focus:ring-0
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        "
                    />
                    <span className="text-[9px] text-type-tertiary uppercase tracking-wider">Bonus</span>
                </div>
            </div>
        );
    }

    // DC-2 and DC-3 share the same UI (Target Number Toggle), but DC-3 needs the modifier
    const isTiered = mode === 'dc-3';

    return (
        <div className={`flex items-center gap-2 bg-canvas-panel rounded-lg px-2 py-1 border border-border h-[64px] ${isTiered ? 'w-[160px]' : 'w-[110px]'} transition-all`}>
            {/* Toggle (Light) */}
            <button
                onClick={toggleEnabled}
                className={`
                    flex flex-col items-center justify-center gap-1
                    outline-none transition-all
                `}
                title={isTiered ? "Toggle Tiered DC" : "Toggle Target Difficulty"}
            >
                <div className={`
                    w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]
                    ${isEnabled ? 'bg-gold shadow-[0_0_12px_rgba(212,165,116,0.8)]' : 'bg-canvas-surface'}
                `} />
                <span className={`text-[10px] font-bold ${isEnabled ? 'text-gold' : 'text-type-tertiary'}`}>
                    DC
                </span>
            </button>

            {/* Target Number Display/Input */}
            <div className={`relative flex flex-col items-center justify-center transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-50'}`}>
                <input
                    type="number"
                    value={targetNumber}
                    onChange={handleTargetChange}
                    className="
                        w-16 bg-transparent text-center text-3xl font-bold text-gold
                        focus:outline-none focus:ring-0
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    "
                />
                <span className="text-[9px] text-type-tertiary uppercase tracking-wider">Target</span>
            </div>

            {/* Tier Differential (DC-3 Only) */}
            {isTiered && (
                <div className={`relative flex flex-col items-center justify-center border-l border-border pl-2 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-50'}`}>
                    <input
                        type="number"
                        value={useDifficultyStore.getState().tierDifferential}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) useDifficultyStore.getState().setTierDifferential(val);
                        }}
                        className="
                            w-12 bg-transparent text-center text-xl font-bold text-type-secondary
                            focus:outline-none focus:ring-0
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        "
                    />
                    <span className="text-[9px] text-type-tertiary uppercase tracking-wider">Diff</span>
                </div>
            )}
        </div>
    );
}
