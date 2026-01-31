import { useState } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { AssetMaterial, AssetShader } from '../../types/settings';

export function DiceSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, updateDiceSettings } = useSettingsStore();

    // Helper Wrappers
    const setDiceColor = (val: string) => updateDiceSettings({ diceColor: val, diceColorSecondary: val });
    const setNumberColor = (val: string) => updateDiceSettings({ numberColor: val, numberColorSecondary: val });
    const setMaterial = (val: AssetMaterial) => updateDiceSettings({ material: val });
    const setSurfaceType = (val: any) => updateDiceSettings({ surfaceType: val });
    const setDiceSet = (val: any) => updateDiceSettings({ diceSet: val });
    const setTexture = (val: string) => updateDiceSettings({ texture: val });
    const setShader = (val: AssetShader) => updateDiceSettings({ shader: val });
    const setShaderColor = (val: string) => updateDiceSettings({ shaderColor: val });

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
            >
                ⚙️ Dice Settings
            </button>
        );
    }

    // ... Render code ... 
    // I need to provide the full render code because replace_file_content needs to replace the whole file content
    // to switch stores everywhere.

    // BUT replace_file_content tool takes StartLine/EndLine.
    // I'll assume I can rewrite the whole file content within the range.

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto shadow-xl border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-100">Dice Settings</h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200">✕</button>
                </div>

                <div className="space-y-4">
                    {/* Dice Color */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                        <div className="flex gap-2">
                            <input type="color" value={settings.dice.diceColor} onChange={(e) => setDiceColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                            <input type="text" value={settings.dice.diceColor} onChange={(e) => setDiceColor(e.target.value)} className="flex-1 bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm" />
                        </div>
                    </div>

                    {/* Number Color */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Number Color</label>
                        <div className="flex gap-2">
                            <input type="color" value={settings.dice.numberColor} onChange={(e) => setNumberColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                            <input type="text" value={settings.dice.numberColor} onChange={(e) => setNumberColor(e.target.value)} className="flex-1 bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm" />
                        </div>
                    </div>

                    {/* Texture Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Texture</label>
                        <select
                            value={settings.dice.texture || 'ledgerandink'}
                            onChange={(e) => setTexture(e.target.value)}
                            className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm"
                        >
                            <option value="ledgerandink">Ledger & Ink</option>
                            <option value="rock">Rock</option>
                            <option value="wood">Wood</option>
                            <option value="metal">Metal</option>
                            <option value="scifi">Sci-Fi</option>
                            <option value="galaxy">Galaxy</option>
                            <option value="cloud">Cloud</option>
                            <option value="rust">Rust</option>
                        </select>
                    </div>

                    {/* Material */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Material</label>
                        <select
                            value={settings.dice.material}
                            onChange={(e) => setMaterial(e.target.value as AssetMaterial)}
                            className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm"
                        >
                            <option value="plastic">Plastic</option>
                            <option value="stone_master">Stone Master</option>
                            <option value="relic_stone">Relic Stone</option>
                            <option value="metal_master">Forged Metal</option>
                            <option value="glass">Glass</option>
                            <option value="void_glass">Void Glass</option>
                            <option value="arcane_resin">Arcane Resin</option>
                        </select>
                    </div>

                    {/* Shader / Effect */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Core Effect</label>
                        <select
                            value={settings.dice.shader || 'none'}
                            onChange={(e) => setShader(e.target.value as AssetShader)}
                            className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm"
                        >
                            <option value="none">None</option>
                            <option value="liquid">Liquid Core</option>
                            <option value="singularity">Singularity</option>
                            <option value="flamecore">Flamecore</option>
                            <option value="vortex">Vortex</option>
                            <option value="nebula">Nebula</option>
                            <option value="caustic">Caustic</option>
                        </select>
                    </div>

                    {(settings.dice.shader && settings.dice.shader !== 'none') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Effect Color</label>
                            <div className="flex gap-2">
                                <input type="color" value={settings.dice.shaderColor || '#ff0055'} onChange={(e) => setShaderColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                                <input type="text" value={settings.dice.shaderColor || '#ff0055'} onChange={(e) => setShaderColor(e.target.value)} className="flex-1 bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm" />
                            </div>
                        </div>
                    )}

                    {/* Surface Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Surface</label>
                        <select
                            value={settings.dice.surfaceType}
                            onChange={(e) => setSurfaceType(e.target.value)}
                            className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm"
                        >
                            {(['felt', 'wood', 'metal', 'rubber', 'glass'] as const).map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dice Set Style */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Dice Shape</label>
                        <select
                            value={settings.dice.diceSet}
                            onChange={(e) => setDiceSet(e.target.value)}
                            className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm"
                        >
                            {(['chamfered', 'rounded', 'sharp', 'stamped', 'valkyrie'] as const).map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
