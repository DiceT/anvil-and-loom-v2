import { create } from 'zustand';
import { DEFAULT_DRAWING_Z } from '../components/map/MapConstants';

export type MapToolType = 'select' | 'pan' | 'brush' | 'erase' | 'fog';

interface MapToolState {
    activeTool: MapToolType;
    brushColor: string;
    brushSize: number;
    opacity: number;
    zLevel: number;

    setTool: (tool: MapToolType) => void;
    setBrushColor: (color: string) => void;
    setBrushSize: (size: number) => void;
    setOpacity: (opacity: number) => void;
    setZLevel: (level: number) => void;
}

export const useMapToolStore = create<MapToolState>((set) => ({
    activeTool: 'pan', // Default to pan for safety
    brushColor: '#000000',
    brushSize: 5,
    opacity: 1,
    zLevel: DEFAULT_DRAWING_Z,

    setTool: (tool) => set({ activeTool: tool }),
    setBrushColor: (color) => set({ brushColor: color }),
    setBrushSize: (size) => set({ brushSize: size }),
    setOpacity: (opacity) => set({ opacity }),
    setZLevel: (level) => set({ zLevel: level }),
}));
