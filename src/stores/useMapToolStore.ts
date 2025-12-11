import { create } from 'zustand';
import { DEFAULT_DRAWING_Z } from '../components/map/MapConstants';

export type MapToolType = 'select' | 'pan' | 'measure' | 'brush' | 'erase' | 'fog-reveal' | 'fog-shroud';

interface MapToolState {
    activeTool: MapToolType;
    brushColor: string;
    brushSize: number;
    opacity: number;
    zLevel: number;
    isMapLocked: boolean;
    isFogEnabled: boolean;
    drawingShape: 'freehand' | 'rectangle';

    setTool: (tool: MapToolType) => void;
    setBrushColor: (color: string) => void;
    setBrushSize: (size: number) => void;
    setOpacity: (opacity: number) => void;
    setDrawingShape: (shape: 'freehand' | 'rectangle') => void;
    setZLevel: (level: number) => void;
    toggleMapLock: () => void;
    toggleFog: () => void;
}

export const useMapToolStore = create<MapToolState>((set) => ({
    activeTool: 'pan', // Default to pan for safety
    brushColor: '#000000',
    brushSize: 5,
    opacity: 1,
    zLevel: DEFAULT_DRAWING_Z,
    isMapLocked: true,
    isFogEnabled: false,
    drawingShape: 'freehand',

    setTool: (tool) => set({ activeTool: tool }),
    setBrushColor: (color) => set({ brushColor: color }),
    setBrushSize: (size) => set({ brushSize: size }),
    setOpacity: (opacity) => set({ opacity }),
    setDrawingShape: (shape) => set({ drawingShape: shape }),
    setZLevel: (level) => set({ zLevel: level }),
    toggleMapLock: () => set((state) => ({ isMapLocked: !state.isMapLocked })),
    toggleFog: () => set((state) => ({ isFogEnabled: !state.isFogEnabled })),
}));
