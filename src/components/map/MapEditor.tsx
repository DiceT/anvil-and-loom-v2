import { useState, useEffect, useCallback, useRef } from 'react';
import { MapCanvas, DrawingLine } from './MapCanvas';
import { MapDevOverlay } from './MapDevOverlay';
import { LeftToolbar } from './LeftToolbar';


interface MapEditorProps {
    panelId: string;
    filePath?: string;
    initialData?: any;
}

export function MapEditor({ panelId, filePath }: MapEditorProps) {
    const [debugInfo, setDebugInfo] = useState({
        scale: 1,
        stageX: 0,
        stageY: 0,
        pointerX: 0,
        pointerY: 0
    });

    const [lines, setLines] = useState<DrawingLine[]>([]);
    const [loaded, setLoaded] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout>();

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
                    if (data.lines) {
                        setLines(data.lines);
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
    const saveMap = useCallback(async (newLines: DrawingLine[]) => {
        if (!filePath) return;

        const freshEntry = await window.electron.tapestry.loadEntry(filePath);
        if (!freshEntry) return;

        const jsonBlock = `\`\`\`json:map-data\n${JSON.stringify({ lines: newLines }, null, 2)}\n\`\`\``;

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

    const handleLinesChange = (newLines: DrawingLine[]) => {
        setLines(newLines);

        // Debounce Save (1s)
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            saveMap(newLines);
        }, 1000);
    };

    return (
        <div className="w-full h-full relative flex flex-col">
            {/* Top Bar (Temporary) */}
            <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
                <span className="text-slate-400 font-medium text-sm">Map Editor: {panelId}</span>
                {!loaded && <span className="text-xs text-yellow-500">Loading...</span>}
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative">
                <MapCanvas
                    lines={lines}
                    onLinesChange={handleLinesChange}
                    onDebugUpdate={(info) => setDebugInfo({
                        scale: info.scale,
                        stageX: info.x,
                        stageY: info.y,
                        pointerX: info.px,
                        pointerY: info.py
                    })}
                />

                {/* Floating Dev Box */}
                <MapDevOverlay
                    scale={debugInfo.scale}
                    stageX={debugInfo.stageX}
                    stageY={debugInfo.stageY}
                    pointerX={debugInfo.pointerX}
                    pointerY={debugInfo.pointerY}
                />

                {/* Left Toolbar */}
                <LeftToolbar />
            </div>
        </div>
    );
}
