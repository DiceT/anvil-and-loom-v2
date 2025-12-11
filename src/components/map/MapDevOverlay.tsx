import { useMapToolStore } from '../../stores/useMapToolStore';

interface MapDevOverlayProps {
    scale: number;
    stageX: number;
    stageY: number;
    pointerX: number;
    pointerY: number;
    fps?: number;
}

export function MapDevOverlay({ scale, stageX, stageY, pointerX, pointerY, fps }: MapDevOverlayProps) {
    return (
        <div className="absolute bottom-4 right-4 bg-black/80 text-green-400 font-mono text-xs p-3 rounded pointer-events-none z-50 shadow-lg border border-slate-700/50">
            <h3 className="uppercase text-slate-500 mb-2 font-bold tracking-wider">Map Debug</h3>
            <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
                <span className="text-slate-500">Scale:</span>
                <span>{(scale * 100).toFixed(0)}%</span>

                <span className="text-slate-500">Stage Offset:</span>
                <span>{stageX.toFixed(0)}, {stageY.toFixed(0)}</span>

                <span className="text-slate-500">Pointer:</span>
                <span>{pointerX.toFixed(0)}, {pointerY.toFixed(0)}</span>

                {fps !== undefined && (
                    <>
                        <span className="text-slate-500">FPS:</span>
                        <span className={`font-bold ${fps < 30 ? 'text-red-500' : 'text-emerald-400'}`}>
                            {fps}
                        </span>
                    </>
                )}

                <span className="text-slate-500">Z-Level:</span>
                <span className="text-indigo-400">{useMapToolStore.getState().zLevel}</span>
            </div>
        </div>
    );
}
