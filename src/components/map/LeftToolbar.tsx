import { MousePointer2, Hand, Pen, Eraser, Ruler, Eye, Cloud, AudioWaveform } from 'lucide-react';
import { useMapToolStore, MapToolType } from '../../stores/useMapToolStore';

export function LeftToolbar() {
    const { activeTool, setTool, brushColor, setBrushColor, brushSize, setBrushSize, isFogEnabled, toggleFog } = useMapToolStore();

    const tools: { id: MapToolType; icon: React.ElementType; label: string }[] = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'pan', icon: Hand, label: 'Pan' },
        { id: 'measure', icon: Ruler, label: 'Ruler' },
        { id: 'brush', icon: Pen, label: 'Draw' },
        { id: 'erase', icon: Eraser, label: 'Erase' },
        { id: 'fog-reveal', icon: Eye, label: 'Reveal Fog' },
        { id: 'fog-shroud', icon: Cloud, label: 'Shroud Fog' },
    ];

    return (
        <div className="absolute left-4 top-4 flex flex-col gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded-lg shadow-xl z-20">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setTool(tool.id)}
                    className={`
                        p-2 rounded transition-colors relative group
                        ${activeTool === tool.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }
                    `}
                    title={tool.label}
                >
                    <tool.icon className="w-5 h-5" />

                    {/* Tooltip */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                        {tool.label}
                    </div>
                </button>
            ))}

            {/* Brush & Eraser & Fog Settings */}
            {(activeTool === 'brush' || activeTool === 'erase' || activeTool === 'fog-reveal' || activeTool === 'fog-shroud') && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-700 mt-1">
                    {/* Colors (Brush Only) */}
                    {activeTool === 'brush' && (
                        <div className="grid grid-cols-2 gap-1.5">
                            {['#000000', '#dc2626', '#16a34a', '#2563eb', '#ffffff'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setBrushColor(color)}
                                    className={`
                                        w-6 h-6 rounded-full border border-slate-600 shadow-sm
                                        ${brushColor === color
                                            ? 'ring-2 ring-indigo-500 scale-110'
                                            : 'hover:scale-110'
                                        }
                                    `}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}

                    {/* Sizes (All Brushes) */}
                    <div className="flex justify-between items-center px-1 mt-1">
                        {[2, 5, 10, 20, 50, 100].map(size => (
                            <button
                                key={size}
                                onClick={() => setBrushSize(size)}
                                className={`
                                    w-6 h-6 rounded flex items-center justify-center
                                    ${brushSize === size
                                        ? 'bg-slate-700 text-white'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }
                                `}
                                title={`Size: ${size}px`}
                            >
                                <div
                                    className="rounded-full bg-current"
                                    style={{ width: Math.max(2, size > 20 ? 10 : size / 2), height: Math.max(2, size > 20 ? 10 : size / 2) }}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Fog Visibility Toggle */}
                    {(activeTool === 'fog-reveal' || activeTool === 'fog-shroud') && (
                        <div className="flex flex-col gap-2 px-1 mt-2 pt-2 border-t border-slate-700">
                            {/* Shape Toggle */}
                            <div className="flex gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
                                <button
                                    onClick={() => useMapToolStore.getState().setDrawingShape('freehand')}
                                    className={`flex-1 p-1 rounded text-xs flex items-center justify-center ${useMapToolStore.getState().drawingShape === 'freehand' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    title="Freehand"
                                >
                                    <AudioWaveform className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => useMapToolStore.getState().setDrawingShape('rectangle')}
                                    className={`flex-1 p-1 rounded text-xs flex items-center justify-center ${useMapToolStore.getState().drawingShape === 'rectangle' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    title="Rectangle"
                                >
                                    <div className="w-3 h-3 border border-current" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={isFogEnabled}
                                    onChange={() => toggleFog()}
                                    className="rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                                    id="fog-toggle"
                                />
                                <label htmlFor="fog-toggle" className="text-xs text-slate-300 cursor-pointer select-none">
                                    Enable Fog Layer
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
