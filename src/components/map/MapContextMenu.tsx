import React from 'react';
import { Trash2 } from 'lucide-react';

interface MapContextMenuProps {
    x: number;
    y: number;
    color?: string; // Current color
    onColorChange: (color: string) => void;
    onDelete: () => void;
    onClose: () => void;
}

const COLORS = [
    '#ef4444', // Red (Default)
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#64748b', // Slate
];

export const MapContextMenu: React.FC<MapContextMenuProps> = ({ x, y, color, onColorChange, onDelete, onClose }) => {
    // click outside to close
    React.useEffect(() => {
        const handleClick = () => onClose();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [onClose]);

    return (
        <div
            className="fixed z-50 bg-slate-800 border border-slate-700 rounded shadow-xl p-2 flex flex-col gap-2 w-48"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
            <div className="text-xs text-slate-400 font-medium px-1">Pin Color</div>
            <div className="grid grid-cols-4 gap-1">
                {COLORS.map((c) => (
                    <button
                        key={c}
                        onClick={() => {
                            onColorChange(c);
                            onClose();
                        }}
                        className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'} hover:scale-110 transition-transform`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
            </div>

            <div className="h-px bg-slate-700 my-1" />

            <button
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                className="flex items-center gap-2 text-red-400 hover:bg-slate-700 p-1.5 rounded text-sm transition-colors"
            >
                <Trash2 size={14} />
                <span>Delete Pin</span>
            </button>
        </div>
    );
};
