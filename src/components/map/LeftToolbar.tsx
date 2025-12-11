import React from 'react';
import { MousePointer2, Hand, Pen, Eraser, CloudFog } from 'lucide-react';
import { useMapToolStore, MapToolType } from '../../stores/useMapToolStore';

export function LeftToolbar() {
    const { activeTool, setTool, brushColor, setBrushColor, brushSize, setBrushSize } = useMapToolStore();

    const tools: { id: MapToolType; icon: React.ElementType; label: string }[] = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'pan', icon: Hand, label: 'Pan' },
        { id: 'brush', icon: Pen, label: 'Draw' },
        { id: 'erase', icon: Eraser, label: 'Erase' },
        { id: 'fog', icon: CloudFog, label: 'Fog' },
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
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
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

            {/* Brush & Eraser Settings */}
            {(activeTool === 'brush' || activeTool === 'erase') && (
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
                                            : 'hover:scale-110'}
                                    `}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}

                    {/* Sizes (Both) */}
                    <div className="flex justify-between items-center px-1 mt-1">
                        {[2, 5, 10, 20].map(size => (
                            <button
                                key={size}
                                onClick={() => setBrushSize(size)}
                                className={`
                                    w-6 h-6 rounded flex items-center justify-center
                                    ${brushSize === size
                                        ? 'bg-slate-700 text-white'
                                        : 'text-slate-500 hover:text-slate-300'}
                                `}
                                title={`Size: ${size}px`}
                            >
                                <div
                                    className="rounded-full bg-current"
                                    style={{ width: Math.max(2, size / 2), height: Math.max(2, size / 2) }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
