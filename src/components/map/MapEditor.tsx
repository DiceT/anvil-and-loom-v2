import { useState, useEffect, useCallback, useRef } from 'react';
import { PloughCanvas, PloughCanvasHandle } from './PloughCanvas';
import { MapDevOverlay } from './MapDevOverlay';
import { LeftToolbar } from './LeftToolbar';
import { MapSettingsModal } from './MapSettingsModal';
import { MapContextMenu } from './MapContextMenu';
import { Settings } from 'lucide-react';


import { useEditorStore } from '../../stores/useEditorStore';
import { useStitchStore } from '../../stores/useStitchStore';

interface MapEditorProps {
    panelId: string;
    filePath?: string;
    initialData?: any;
}

export function MapEditor({ panelId, filePath }: MapEditorProps) {
    const ploughRef = useRef<PloughCanvasHandle>(null);

    const [debugInfo, setDebugInfo] = useState<{
        scale: number;
        stageX: number;
        stageY: number;
        pointerX: number;
        pointerY: number;
        fps?: number;
    }>({
        scale: 1,
        stageX: 0,
        stageY: 0,
        pointerX: 0,
        pointerY: 0
    });

    const [gridSettings, setGridSettings] = useState<any>({ // TODO: Type this properly
        type: 'square',
        scale: 1,
        unitNumber: 5,
        unitType: 'ft'
    });
    const [loaded, setLoaded] = useState(false);
    const [mapData, setMapData] = useState<any>(null); // Initial data
    const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Load Entry Data
    useEffect(() => {
        const load = async () => {
            if (!filePath) return;

            const entry = await window.electron.tapestry.loadEntry(filePath);
            if (!entry) return;

            // Simple parsing strategy: look for JSON code block
            const match = entry.content.match(/```json:map-data\s*([\s\S]*?)\s*```/);
            if (match && match[1]) {
                try {
                    const data = JSON.parse(match[1]);
                    setMapData(data);
                    if (data.grid) setGridSettings({ ...gridSettings, ...data.grid });

                    // If engine already mounted, load directly
                    if (ploughRef.current) {
                        ploughRef.current.loadData(data);
                    }
                } catch (e) {
                    console.error('Failed to parse map data', e);
                }
            }
            setLoaded(true);
        };
        load();
    }, [filePath]);

    // Save Logic
    const saveMap = useCallback(async () => {
        if (!filePath || !ploughRef.current) return;

        const currentData = ploughRef.current.getData();
        if (!currentData) return;

        const freshEntry = await window.electron.tapestry.loadEntry(filePath);
        if (!freshEntry) return;

        const jsonBlock = `\`\`\`json:map-data\n${JSON.stringify(currentData, null, 2)}\n\`\`\``;

        let newContent = freshEntry.content;
        const regex = /```json:map-data[\s\S]*?```/;

        if (regex.test(newContent)) {
            newContent = newContent.replace(regex, jsonBlock);
        } else {
            newContent = newContent + '\n\n' + jsonBlock;
        }

        freshEntry.content = newContent;
        await window.electron.tapestry.saveEntry(freshEntry);
    }, [filePath]);

    const triggerSave = useCallback(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            saveMap();
        }, 1000);
    }, [saveMap]);

    // Passed to PloughCanvas to trigger updates
    const handleDataChange = useCallback(() => {
        triggerSave();
    }, [triggerSave]);

    const handleGridChange = useCallback((newGrid: any) => {
        setGridSettings(newGrid);
        // TODO: Push to Plough Engine via ref
        // if (ploughRef.current) ploughRef.current.updateGrid(newGrid);
        triggerSave();
    }, [triggerSave]);

    const handleDebugUpdate = useCallback((info: any) => {
        setDebugInfo(prev => ({
            ...prev,
            scale: info.scale !== undefined ? info.scale : prev.scale,
            stageX: info.x !== undefined ? info.x : prev.stageX,
            stageY: info.y !== undefined ? info.y : prev.stageY,
            pointerX: info.px !== undefined ? info.px : prev.pointerX,
            pointerY: info.py !== undefined ? info.py : prev.pointerY,
            fps: info.fps !== undefined ? info.fps : prev.fps
        }));
    }, []);

    // --- Drag & Drop ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const [isSettingsOpen, setSettingsOpen] = useState(false);

    // Context Menu handled by Engine internally now? 
    // Or we need to implement a bridge. For now disable old context menu.
    const [contextMenu, setContextMenu] = useState<any>(null);

    const handleTokenContextMenu = (e: any, token: any) => {
        // e comes from PloughCanvas { x, y, token }
        // Prevent default if it was a DOM event, but here e is data object
        setContextMenu({
            x: e.x,
            y: e.y,
            tokenId: token.id,
            color: token.properties?.fill // Adapt to Plough model
        });
    };

    const handleColorChange = (color: string) => {
        if (!contextMenu || !ploughRef.current) return;
        ploughRef.current.updateToken(contextMenu.tokenId, { color });
        triggerSave();
    };

    const handleDeletePin = () => {
        if (!contextMenu || !ploughRef.current) return;
        ploughRef.current.deleteToken(contextMenu.tokenId);
        triggerSave();
    };

    const handleImportMap = async () => {
        // TODO: Implement Import via Plough API
        // if (ploughRef.current) ploughRef.current.importImage(...);
        try {
            const filePath = await window.electron.tapestry.pickImage();
            if (!filePath) return;

            // Ensure protocol (media:// for custom Electron handler)
            // Normalize path separators to forward slashes for consistency
            const normalizedPath = filePath.replace(/\\/g, '/');

            let src = normalizedPath;
            if (!src.startsWith('media://')) {
                if (src.startsWith('/')) {
                    src = `media://${src}`; // media:///path
                } else {
                    src = `media:///${src}`; // media:///C:/path
                }
            }

            if (ploughRef.current) {
                ploughRef.current.addToken({
                    id: crypto.randomUUID(),
                    x: 0,
                    y: 0,
                    rotation: 0,
                    src: src,
                    type: 'token',
                    // layerId is optional for addToken, Engine assigns active
                    properties: {
                        width: 500,
                        height: 500
                    }
                });
                triggerSave();
            }

        } catch (err) {
            console.error('Failed to import map:', err);
        }
    };

    const handleOpenEntry = useCallback((id: string, _newTab?: boolean) => {
        // Resolve ID to Path
        const stitchStore = useStitchStore.getState();
        const title = stitchStore.idToTitle[id];

        if (!title) {
            console.error('Failed to find title for entry ID:', id);
            return;
        }

        const panel = stitchStore.panelMap[title.toLowerCase()];
        if (!panel) {
            console.error('Failed to find panel for title:', title);
            return;
        }

        useEditorStore.getState().openEntry(panel.path);
    }, []);

    return (
        <div
            className="w-full h-full relative flex flex-col"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Top Bar (Temporary) */}
            <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
                <span className="text-slate-400 font-medium text-sm">Map Editor: {panelId}</span>
                <div className="flex items-center gap-4">
                    {!loaded && <span className="text-xs text-yellow-500">Loading...</span>}
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Map Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    {/* Explicit Save for Debug */}
                    <button onClick={saveMap} className="text-xs bg-blue-600 px-2 py-1 rounded text-white">Save</button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative">
                <LeftToolbar />

                <PloughCanvas
                    ref={ploughRef}
                    initialData={mapData}
                    onDataChange={handleDataChange}
                    onDebugUpdate={handleDebugUpdate}
                    onOpenEntry={handleOpenEntry}
                    onTokenContextMenu={handleTokenContextMenu}
                />

                {/* Overlays */}
                <MapDevOverlay
                    scale={debugInfo.scale}
                    stageX={debugInfo.stageX}
                    stageY={debugInfo.stageY}
                    pointerX={debugInfo.pointerX}
                    pointerY={debugInfo.pointerY}
                    fps={debugInfo.fps}
                />

                <MapSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onImportMap={handleImportMap}
                    gridSettings={gridSettings}
                    onGridChange={handleGridChange}
                />

                {contextMenu && (
                    <MapContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        color={contextMenu.color}
                        onColorChange={handleColorChange}
                        onDelete={handleDeletePin}
                        onClose={() => setContextMenu(null)}
                    />
                )}
            </div>
        </div>
    );
}
