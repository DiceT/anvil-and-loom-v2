import { useEffect, useLayoutEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Plough } from 'plough-map-engine';
import { useMapToolStore } from '../../stores/useMapToolStore';
import 'plough-map-engine/dist/style.css';

interface PloughCanvasProps {
    initialData?: any;
    onDataChange?: () => void;
    onDebugUpdate?: (info: any) => void;
    onOpenEntry?: (id: string, newTab?: boolean) => void;
    onTokenContextMenu?: (e: any, token: any) => void;
}

export interface PloughCanvasHandle {
    getData: () => any;
    loadData: (data: any) => void;
    addToken: (token: any) => void;
    updateToken: (id: string, updates: any) => void;
    deleteToken: (id: string) => void;
}

export const PloughCanvas = forwardRef<PloughCanvasHandle, PloughCanvasProps>(({ initialData, onDataChange, onDebugUpdate, onOpenEntry, onTokenContextMenu }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const ploughRef = useRef<Plough | null>(null);
    const [engineReady, setEngineReady] = useState(false);

    // Store Access
    const {
        activeTool,
        activeStamp,
        // isGridSnapEnabled, // TODO: Wire this up
    } = useMapToolStore();

    // Expose API to Parent
    useImperativeHandle(ref, () => ({
        getData: () => {
            if (!ploughRef.current) return null;
            return ploughRef.current.engine.serializer.serialize();
        },
        loadData: (data: any) => {
            if (!ploughRef.current) return;
            if (typeof data === 'object') {
                ploughRef.current.engine.serializer.deserialize(data);
            } else {
                ploughRef.current.loadMap(data);
            }
        },
        addToken: (token: any) => {
            if (ploughRef.current) {
                ploughRef.current.addToken(token);
            }
        },
        updateToken: (id: string, updates: any) => {
            if (ploughRef.current) {
                ploughRef.current.updateToken(id, updates);
            }
        },
        deleteToken: (id: string) => {
            if (ploughRef.current) {
                ploughRef.current.deleteToken(id);
            }
        }
    }));

    // 1. Initialize Engine
    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const plough = new Plough(containerRef.current);
        ploughRef.current = plough;

        // Bridge Events
        plough.on('ready', () => {
            setEngineReady(true);
            if (initialData) {
                if (typeof initialData === 'object') {
                    plough.engine.serializer.deserialize(initialData);
                } else {
                    plough.loadMap(initialData);
                }
            }
        });

        // Global Event Listener for Token Context (from generic window event)
        const handleTokenContext = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (onTokenContextMenu) {
                onTokenContextMenu(detail, detail.token);
            }
        }
        window.addEventListener('plough-token-context', handleTokenContext);

        // Hacky Auto-Save on Interaction End
        const handleInteractionEnd = () => {
             if (onDataChange) onDataChange();
        };
        plough.app.stage.on('pointerup', handleInteractionEnd);
        plough.app.stage.on('pointerupoutside', handleInteractionEnd);

        // Forward Context Menu
        if (onTokenContextMenu) {
            // TODO: Ensure engine emits 'tokenContext'
            // plough.on('tokenContext', (e: any) => onTokenContextMenu(e, e.token));
        }

        if (onOpenEntry) {
            // TODO: Link double-click or similar interaction
        }

        // Debug Loop
        const updateDebug = () => {
            if (onDebugUpdate) {
                onDebugUpdate({
                    fps: plough.app.ticker.FPS,
                    // scale: plough.camera.zoom
                });
            }
        };
        plough.app.ticker.add(updateDebug);

        return () => {
            window.removeEventListener('plough-token-context', handleTokenContext);
            plough.app.ticker.remove(updateDebug);
            plough.destroy();
            ploughRef.current = null;
        };
    }, []);

    // 2. Sync Tools
    useEffect(() => {
        if (!ploughRef.current || !engineReady) return;

        const engine = ploughRef.current;

        switch (activeTool) {
            case 'pan':
                // @ts-ignore
                engine.setTool('pan');
                break;
            case 'select':
                // @ts-ignore
                engine.setTool('pan');
                break;
            case 'room':
                engine.setTool('rectangle');
                break;
            case 'wall':
                engine.setTool('wall'); // Assuming wall tool string is 'wall'
                break;
            case 'brush':
                // @ts-ignore
                engine.setTool('polygon');
                break;
            case 'stamp':
                if (activeStamp === 'door') engine.setTool('door');
                else engine.setTool('object');
                break;
            default:
                // console.warn(`Tool ${activeTool} not mapped yet.`);
                break;
        }

    }, [activeTool, activeStamp, engineReady]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-slate-900 overflow-hidden relative"
        />
    );
});

PloughCanvas.displayName = 'PloughCanvas';
