import { useState } from 'react';
import { useDiceStore } from '../../stores/useDiceStore';
import { MaterialPreset } from '../dice/DiceMaterials';

export function DiceSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, setDiceColor, setNumberColor, setMaterial, setSurfaceType, setDiceSet } = useDiceStore();

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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-96 shadow-xl border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-100">Dice Settings</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Dice Color */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Dice Color
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={settings.diceColor}
                                onChange={(e) => setDiceColor(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={settings.diceColor}
                                onChange={(e) => setDiceColor(e.target.value)}
                                className="flex-1 bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm"
                                placeholder="#8b5cf6"
                            />
                        </div>
                    </div>

                    {/* Number Color */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Number Color
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={settings.numberColor}
                                onChange={(e) => setNumberColor(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={settings.numberColor}
                                onChange={(e) => setNumberColor(e.target.value)}
                                className="flex-1 bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm"
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>

                    {/* Material */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Material
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['plastic', 'metal', 'wood', 'glass'] as MaterialPreset[]).map((mat) => (
                                <button
                                    key={mat}
                                    onClick={() => setMaterial(mat)}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${settings.material === mat
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {mat.charAt(0).toUpperCase() + mat.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dice Style */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Dice Style
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['chamfered', 'rounded', 'sharp', 'stamped', 'valkyrie'] as const).map((set) => (
                                <button
                                    key={set}
                                    onClick={() => setDiceSet(set)}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${settings.diceSet === set
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {set.charAt(0).toUpperCase() + set.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Surface Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Surface
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['felt', 'wood', 'metal'] as const).map((surface) => (
                                <button
                                    key={surface}
                                    onClick={() => setSurfaceType(surface)}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${settings.surfaceType === surface
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {surface.charAt(0).toUpperCase() + surface.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(false)}
                    className="w-full mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
                >
                    Apply Settings
                </button>
            </div>
        </div>
    );
}
