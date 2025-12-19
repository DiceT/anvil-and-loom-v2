import { MousePointer2, Hand, Pen, Eraser, Ruler, Eye, Cloud, AudioWaveform, Magnet, Stamp, Square } from 'lucide-react';
import { useMapToolStore, MapToolType, StampType } from '../../stores/useMapToolStore';

export function LeftToolbar() {
    const { activeTool, setTool, brushColor, setBrushColor, brushSize, setBrushSize, isFogEnabled, toggleFog, isGridSnapEnabled, toggleGridSnap, drawingShape, setDrawingShape, activeStamp, setActiveStamp } = useMapToolStore();

    const tools: { id: MapToolType; icon: React.ElementType; label: string }[] = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'pan', icon: Hand, label: 'Pan' },
        { id: 'measure', icon: Ruler, label: 'Ruler' },
        { id: 'brush', icon: Pen, label: 'Draw' },
        { id: 'erase', icon: Eraser, label: 'Erase' },
        { id: 'room', icon: Square, label: 'Room' },
        { id: 'stamp', icon: Stamp, label: 'Stamp' },
        { id: 'fog-reveal', icon: Eye, label: 'Reveal Fog' },
        { id: 'fog-shroud', icon: Cloud, label: 'Shroud Fog' },
    ];

    const stamps: { id: StampType; label: string }[] = [
        { id: 'door', label: 'Door' },
        { id: 'secret-door', label: 'Secret Door' },
        { id: 'stairs', label: 'Stairs' },
        { id: 'column', label: 'Column' },
        { id: 'trap', label: 'Trap' },
        { id: 'statue', label: 'Statue' },
        { id: 'chest', label: 'Chest' },
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

            {/* Brush & Eraser & Fog & Room Settings */}
            {(activeTool === 'brush' || activeTool === 'erase' || activeTool === 'room' || activeTool === 'fog-reveal' || activeTool === 'fog-shroud') && (
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

                </div>
            )}

            {/* Shape & Snap Settings for Draw Tools */}
            {(activeTool === 'brush' || activeTool === 'erase' || activeTool === 'room' || activeTool === 'fog-reveal' || activeTool === 'fog-shroud') && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-700 mt-1">
                    <div className="flex gap-1">
                        {/* Shape Toggle */}
                        <div className="flex flex-1 gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
                            <button
                                onClick={() => setDrawingShape('freehand')}
                                className={`flex-1 p-1 rounded text-xs flex items-center justify-center ${drawingShape === 'freehand' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Freehand"
                            >
                                <AudioWaveform className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setDrawingShape('rectangle')}
                                className={`flex-1 p-1 rounded text-xs flex items-center justify-center ${drawingShape === 'rectangle' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Rectangle"
                            >
                                <div className="w-3 h-3 border border-current" />
                            </button>
                        </div>

                        {/* Snap Toggle */}
                        <button
                            onClick={() => toggleGridSnap()}
                            className={`p-1.5 rounded border border-slate-700 flex items-center justify-center ${isGridSnapEnabled ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            title="Snap to Grid"
                        >
                            <Magnet className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Fog specific toggle */}
                    {(activeTool === 'fog-reveal' || activeTool === 'fog-shroud') && (
                        <div className="flex items-center gap-2 mt-1">
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
                    )}
                </div>
            )}

            {/* Stamp Settings */}
            {activeTool === 'stamp' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-700 mt-1">
                    <div className="grid grid-cols-2 gap-1.5">
                        {stamps.map(stamp => (
                            <button
                                key={stamp.id}
                                onClick={() => setActiveStamp(stamp.id)}
                                className={`
                                    px-2 py-1 text-xs rounded border border-slate-600 truncate
                                    ${activeStamp === stamp.id
                                        ? 'bg-indigo-600 text-white border-indigo-500'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }
                                `}
                                title={stamp.label}
                            >
                                {stamp.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-1 mt-1">
                        {/* Snap Toggle for Stamps */}
                        <button
                            onClick={() => toggleGridSnap()}
                            className={`flex-1 p-1.5 rounded border border-slate-700 flex items-center justify-center gap-2 text-xs ${isGridSnapEnabled ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            title="Snap to Grid"
                        >
                            <Magnet className="w-3 h-3" />
                            <span>Snap</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
