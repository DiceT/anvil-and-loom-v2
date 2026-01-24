import { useSettingsStore } from '../../stores/useSettingsStore';
import { MaterialPreset, DiceSetType, SurfaceType } from '../../types/settings';

export function DiceSettingsPanel() {
    const { settings, updateDiceSettings } = useSettingsStore();
    const { dice } = settings;

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium text-type-primary mb-4">Appearance</h3>
                <div className="grid grid-cols-2 gap-6">
                    {/* Dice Color */}
                    <div>
                        <label className="block text-sm font-medium text-type-secondary mb-2">
                            Dice Color
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={dice.diceColor}
                                onChange={(e) => updateDiceSettings({ diceColor: e.target.value })}
                                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input
                                type="text"
                                value={dice.diceColor}
                                onChange={(e) => updateDiceSettings({ diceColor: e.target.value })}
                                className="flex-1 bg-canvas-surface border border-border text-type-primary px-3 py-2 rounded text-sm focus:outline-none focus:border-gold"
                                placeholder="#8b5cf6"
                            />
                        </div>
                    </div>

                    {/* Number Color */}
                    <div>
                        <label className="block text-sm font-medium text-type-secondary mb-2">
                            Number Color
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={dice.numberColor}
                                onChange={(e) => updateDiceSettings({ numberColor: e.target.value })}
                                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input
                                type="text"
                                value={dice.numberColor}
                                onChange={(e) => updateDiceSettings({ numberColor: e.target.value })}
                                className="flex-1 bg-canvas-surface border border-border text-type-primary px-3 py-2 rounded text-sm focus:outline-none focus:border-gold"
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-medium text-type-primary mb-4">Material & Style</h3>
                <div className="space-y-6">
                    {/* Material */}
                    <div>
                        <label className="block text-sm font-medium text-type-secondary mb-2">
                            Material
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['plastic', 'metal', 'wood', 'glass'] as MaterialPreset[]).map((mat) => (
                                <button
                                    key={mat}
                                    onClick={() => updateDiceSettings({ material: mat })}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors border ${dice.material === mat
                                        ? 'bg-gold border-gold text-canvas'
                                        : 'bg-canvas-surface border-border text-type-secondary hover:bg-border'
                                        }`}
                                >
                                    {mat.charAt(0).toUpperCase() + mat.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dice Style */}
                    <div>
                        <label className="block text-sm font-medium text-type-secondary mb-2">
                            Dice Style
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['chamfered', 'rounded', 'sharp', 'stamped', 'valkyrie'] as DiceSetType[]).map((set) => (
                                <button
                                    key={set}
                                    onClick={() => updateDiceSettings({ diceSet: set })}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors border ${dice.diceSet === set
                                        ? 'bg-gold border-gold text-canvas'
                                        : 'bg-canvas-surface border-border text-type-secondary hover:bg-border'
                                        }`}
                                >
                                    {set.charAt(0).toUpperCase() + set.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Surface Type */}
                    <div>
                        <label className="block text-sm font-medium text-type-secondary mb-2">
                            Surface
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['felt', 'wood', 'metal'] as SurfaceType[]).map((surface) => (
                                <button
                                    key={surface}
                                    onClick={() => updateDiceSettings({ surfaceType: surface })}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors border ${dice.surfaceType === surface
                                        ? 'bg-gold border-gold text-canvas'
                                        : 'bg-canvas-surface border-border text-type-secondary hover:bg-border'
                                        }`}
                                >
                                    {surface.charAt(0).toUpperCase() + surface.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
