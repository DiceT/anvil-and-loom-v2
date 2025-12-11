import { useState, useEffect, useCallback, useRef } from 'react';
import { MapCanvas, DrawingLine, MapToken } from './MapCanvas';
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

    const [lines, setLines] = useState<DrawingLine[]>([]);
    const [tokens, setTokens] = useState<MapToken[]>([]);
    const [fogLines, setFogLines] = useState<DrawingLine[]>([]);
    const [gridSettings, setGridSettings] = useState<any>({ // TODO: Type this properly
        type: 'square',
        scale: 1,
        unitNumber: 5,
        unitType: 'ft'
    });
    const [loaded, setLoaded] = useState(false);
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
                    if (data.lines) setLines(data.lines);
                    if (data.fogLines) setFogLines(data.fogLines);
                    if (data.tokens) setTokens(data.tokens);
                    if (data.grid) setGridSettings({ ...gridSettings, ...data.grid }); // Merge with defaults
                } catch (e) {
                    console.error('Failed to parse map data', e);
                }
            }
            setLoaded(true);
        };
        load();
    }, [filePath]);

    // Save Logic
    const saveMap = useCallback(async (newLines: DrawingLine[], newFogLines: DrawingLine[], newTokens: MapToken[], newGrid: any) => {
        if (!filePath) return;

        const freshEntry = await window.electron.tapestry.loadEntry(filePath);
        if (!freshEntry) return;

        const jsonBlock = `\`\`\`json:map-data\n${JSON.stringify({ lines: newLines, fogLines: newFogLines, tokens: newTokens, grid: newGrid }, null, 2)}\n\`\`\``;

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

    const triggerSave = useCallback((currentLines: DrawingLine[], currentFogLines: DrawingLine[], currentTokens: MapToken[], currentGrid: any) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            saveMap(currentLines, currentFogLines, currentTokens, currentGrid);
        }, 1000);
    }, [saveMap]);

    const handleLinesChange = useCallback((newLines: DrawingLine[]) => {
        setLines(newLines);
        triggerSave(newLines, fogLines, tokens, gridSettings);
    }, [fogLines, tokens, gridSettings, triggerSave]);

    const handleFogChange = useCallback((newFogLines: DrawingLine[]) => {
        setFogLines(newFogLines);
        triggerSave(lines, newFogLines, tokens, gridSettings);
    }, [lines, tokens, gridSettings, triggerSave]);

    const handleTokensChange = useCallback((newTokens: MapToken[]) => {
        setTokens(newTokens);
        triggerSave(lines, fogLines, newTokens, gridSettings);
    }, [lines, fogLines, gridSettings, triggerSave]);

    const handleGridChange = useCallback((newGrid: any) => {
        setGridSettings(newGrid);
        triggerSave(lines, fogLines, tokens, newGrid);
    }, [lines, fogLines, tokens, triggerSave]);

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
        // ... (existing drop logic passed to Canvas via props? No, Canvas handles drop)
        // MapEditor handles drag over only for container
        e.preventDefault();
        e.stopPropagation();
    };

    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tokenId: string, color?: string } | null>(null);

    const handleTokenContextMenu = (e: any, token: MapToken) => {
        // e is KonvaEventObject
        e.evt.preventDefault();
        setContextMenu({
            x: e.evt.clientX,
            y: e.evt.clientY,
            tokenId: token.id,
            color: token.color
        });
    };

    const handleColorChange = (color: string) => {
        if (!contextMenu) return;
        const newTokens = tokens.map(t => t.id === contextMenu.tokenId ? { ...t, color } : t);
        setTokens(newTokens);
        triggerSave(lines, fogLines, newTokens, gridSettings);
    };

    const handleDeletePin = () => {
        if (!contextMenu) return;
        const newTokens = tokens.filter(t => t.id !== contextMenu.tokenId);
        setTokens(newTokens);
        triggerSave(lines, fogLines, newTokens, gridSettings);
    };

    const handleImportMap = async () => {
        try {
            const filePath = await window.electron.tapestry.pickImage();
            if (!filePath) return;

            // Create a token for the map
            // We don't know dimensions yet, so we set a default and let the user resize
            // Or we could try to load it to get dimensions, but for now 1000x1000 is a safe start for a map?
            // Ensure protocol (media:// for custom Electron handler)
            // Normalize path separators to forward slashes for consistency
            const normalizedPath = filePath.replace(/\\/g, '/');

            // For Windows paths (C:/...), we want media:///C:/...
            // For Unix paths (/home/...), we want media:///home/...
            // Basically we need 3 slashes if it doesn't have them.

            let src = normalizedPath;
            if (!src.startsWith('media://')) {
                if (src.startsWith('/')) {
                    src = `media://${src}`; // media:///path
                } else {
                    src = `media:///${src}`; // media:///C:/path
                }
            }

            const newToken: any = { // TODO: Import MapToken type properly
                id: crypto.randomUUID(),
                x: 0,
                y: 0,
                src: src, // Using media protocol
                type: 'token',
                zLevel: 5, // BASE Layer (0-9)
                width: 500, // Default map size, user can resize
                height: 500,
                rotation: 0
            };

            const newTokens = [...tokens, newToken];
            setTokens(newTokens);
            triggerSave(lines, fogLines, newTokens, gridSettings);

        } catch (err) {
            // console.error('Failed to import map:', err);
        }
    };

    const handleOpenEntry = useCallback((id: string, newTab?: boolean) => {
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
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative">
                <LeftToolbar />
                <MapCanvas
                    lines={lines}
                    fogLines={fogLines}
                    tokens={tokens}
                    gridSettings={gridSettings}
                    onLinesChange={handleLinesChange}
                    onFogChange={handleFogChange}
                    onTokensChange={handleTokensChange}
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
