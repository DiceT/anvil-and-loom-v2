import { X, Image as ImageIcon } from 'lucide-react';

import { useMapToolStore } from '../../stores/useMapToolStore';
import { MapGridSettings } from './MapCanvas';

interface MapSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportMap: () => void;
    gridSettings: MapGridSettings;
    onGridChange: (settings: MapGridSettings) => void;
}

export function MapSettingsModal({ isOpen, onClose, onImportMap, gridSettings, onGridChange }: MapSettingsModalProps) {
    const { isMapLocked, toggleMapLock } = useMapToolStore();

    if (!isOpen) return null;

    const updateGrid = (updates: Partial<MapGridSettings>) => {
        onGridChange({ ...gridSettings, ...updates });
    };

    const getUnitLabel = () => {
        switch (gridSettings.type) {
            case 'hex': return '1 Hex';
            case 'square': return '1 Square';
            default: return '1 Unit';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-[400px] max-w-full flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-indigo-400" />
                        Map Settings
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">

                    {/* Grid Configuration */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Grid System
                        </label>

                        {/* Type Selector */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {(['square', 'hex', 'none'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => updateGrid({ type })}
                                    className={`
                                        py-2 px-3 text-sm rounded border capitalize transition-colors
                                        ${gridSettings.type === type
                                            ? 'bg-indigo-600 border-indigo-500 text-white'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}
                                    `}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Grid Scale */}
                        {gridSettings.type !== 'none' && (
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-slate-300">Grid Scale</span>
                                    <span className="text-xs text-slate-500">{gridSettings.scale.toFixed(1)}x</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="range"
                                        min="0.2"
                                        max="10"
                                        step="0.1"
                                        value={gridSettings.scale}
                                        onChange={(e) => updateGrid({ scale: parseFloat(e.target.value) })}
                                        className="flex-1 accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <input
                                        type="number"
                                        min="0.2"
                                        max="10"
                                        step="0.1"
                                        value={gridSettings.scale}
                                        onChange={(e) => updateGrid({ scale: parseFloat(e.target.value) })}
                                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-center focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Measurements */}
                        <div className="flex items-center gap-2 bg-slate-800/30 p-2 rounded border border-slate-800/50">
                            <span className="text-sm text-slate-400 whitespace-nowrap">{getUnitLabel()} =</span>
                            <input
                                type="number"
                                min="1"
                                value={gridSettings.unitNumber}
                                onChange={(e) => updateGrid({ unitNumber: parseFloat(e.target.value) })}
                                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-center focus:border-indigo-500 outline-none"
                            />
                            <select
                                value={gridSettings.unitType}
                                onChange={(e) => updateGrid({ unitType: e.target.value as any })}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none"
                            >
                                <option value="ft">Feet (ft)</option>
                                <option value="m">Meters (m)</option>
                                <option value="km">Kilometers</option>
                                <option value="mi">Miles</option>
                            </select>
                        </div>
                    </div>

                    <div className="h-px bg-slate-800 my-2" />

                    {/* Base Map Section */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Base Layer
                        </label>

                        <div className="flex items-center justify-between mb-3 bg-slate-800/50 p-2 rounded border border-slate-800">
                            <span className="text-sm text-slate-300">Lock Base Layer</span>
                            <button
                                onClick={toggleMapLock}
                                className={`
                                    w-10 h-5 rounded-full transition-colors relative
                                    ${isMapLocked ? 'bg-indigo-600' : 'bg-slate-600'}
                                `}
                            >
                                <div className={`
                                    absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform
                                    ${isMapLocked ? 'translate-x-5' : 'translate-x-0'}
                                `} />
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                onImportMap();
                                onClose();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 hover:text-white transition-all group"
                        >
                            <ImageIcon className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                            <span>Import Base Map Image</span>
                        </button>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Loads an image onto the lowest map layer.
                        </p>
                    </div>

                    {/* Future Settings (Grid etc) */}
                    {/* 
                    <div className="pt-4 border-t border-slate-800">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Grid
                        </label>
                        ...
                    </div> 
                    */}

                </div>
            </div>
        </div>
    );
}
