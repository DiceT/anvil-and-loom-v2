import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Circle, Image as KonvaImage, Transformer, Text, Shape, Group, Path, Tag, Label } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useMapToolStore } from '../../stores/useMapToolStore';

export interface DrawingLine {
    points: number[];
    stroke: string;
    strokeWidth: number;
    tool?: 'brush' | 'erase' | 'fog-reveal' | 'fog-shroud';
    shape?: 'freehand' | 'rectangle';
}

export interface MapToken {
    id: string;
    x: number;
    y: number;
    src: string; // URL or Local Path
    type: 'token' | 'pin';
    zLevel: number;
    width: number;
    height: number;
    rotation?: number;
    linkedEntryId?: string;
    color?: string;
    label?: string; // Entry Title
    blurb?: string; // Short snippet
}

export interface MapGridSettings {
    type: 'none' | 'square' | 'hex';
    scale: number; // Multiplier, default 1
    unitNumber: number; // e.g. 5
    unitType: 'ft' | 'm' | 'km' | 'mi';
}

interface MapCanvasProps {
    children?: React.ReactNode;
    lines: DrawingLine[];
    fogLines: DrawingLine[];
    tokens: MapToken[];
    gridSettings: MapGridSettings;
    onLinesChange: (lines: DrawingLine[]) => void;
    onFogChange: (lines: DrawingLine[]) => void;
    onTokensChange: (tokens: MapToken[]) => void;
    onDebugUpdate?: (data: { scale: number; x: number; y: number; px: number; py: number; fps?: number }) => void;
    onOpenEntry?: (id: string, newTab?: boolean) => void;
    onTokenContextMenu?: (e: KonvaEventObject<PointerEvent>, token: MapToken) => void;
}

// Helper: Image Component for Konva
interface URLImageProps {
    token: MapToken;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newToken: MapToken) => void;
    draggable: boolean;
    listening?: boolean;
}
const URLImage = ({ token, isSelected, onSelect, onChange, draggable, listening = true }: URLImageProps) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        const img = new window.Image();
        img.src = token.src;
        img.onload = () => {
            setImage(img);
        };
        img.onerror = (err) => {
            console.error('URLImage failed to load:', token.src, err);
        };
    }, [token.src]);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    if (!image) return null;

    return (
        <>
            <KonvaImage
                ref={shapeRef}
                image={image}
                x={token.x}
                y={token.y}
                width={token.width}
                height={token.height}
                offsetX={token.width / 2}
                offsetY={token.height / 2}
                rotation={token.rotation}
                draggable={draggable}
                listening={listening}
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onChange({
                        ...token,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={() => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    node.scaleX(1);
                    node.scaleY(1);

                    onChange({
                        ...token,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                        rotation: node.rotation()
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

// MapPin Component
interface MapPinProps {
    token: MapToken;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newToken: MapToken) => void;
    onClick: () => void;
    onContextMenu: (e: KonvaEventObject<PointerEvent>) => void;
}

const MapPin = React.memo(({ token, isSelected, onSelect, onChange, onClick, onContextMenu }: MapPinProps) => {
    const groupRef = useRef<any>(null);
    const [hovered, setHovered] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Default Color #ef4444 (Red-500) if not set
    const pinColor = token.color || '#ef4444';

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    return (
        <Group
            ref={groupRef}
            x={token.x}
            y={token.y}
            draggable
            onClick={(e) => {
                if (e.evt.button === 0) { // Left Click
                    onSelect();
                }
            }}
            onContextMenu={onContextMenu}
            onDragEnd={(e) => {
                onChange({
                    ...token,
                    x: e.target.x(),
                    y: e.target.y(),
                });
            }}
            onMouseEnter={(e) => {
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                }
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'pointer';
                setHovered(true);
            }}
            onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';

                hoverTimeoutRef.current = setTimeout(() => {
                    setHovered(false);
                }, 100);
            }}
        >
            {/* Standard Map Pin SVG */}
            <Path
                data="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
                fill={pinColor}
                stroke={isSelected ? '#ffffff' : '#000000'}
                strokeWidth={isSelected ? 2 : 1}
                fillRule="evenodd" // Makes the inner circle a hole
                scaleX={1.35}
                scaleY={1.35}
                offsetX={12}
                offsetY={22}
                shadowColor="black"
                shadowBlur={5}
                shadowOpacity={0.5}
                hitStrokeWidth={10} // Easier to hover
            />

            {hovered && (
                <Label
                    x={0}
                    y={-30}
                    onClick={(e) => {
                        e.cancelBubble = true; // Stop propagation to map
                        onClick(); // Open entry
                    }}
                    onTap={(e) => {
                        e.cancelBubble = true;
                        onClick();
                    }}
                >
                    <Tag
                        fill="rgba(0,0,0,0.75)"
                        pointerDirection="down"
                        pointerWidth={0}
                        pointerHeight={0}
                        cornerRadius={4}
                    />
                    <Text
                        text={`${token.label || 'Unknown Entry'}`}
                        fontSize={14}
                        padding={6}
                        fill="white"
                        align="center"
                    />
                </Label>
            )}
        </Group>
    );
});

const MapCanvasComponent = ({ children, lines, fogLines, tokens, gridSettings, onLinesChange, onFogChange, onTokensChange, onDebugUpdate, onOpenEntry, onTokenContextMenu }: MapCanvasProps) => {
    const stageRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const lastDebugUpdateTimeRef = useRef(0);

    // FPS State
    const lastTimeRef = useRef(performance.now());
    const frameCountRef = useRef(0);
    const [fps, setFps] = useState(0);

    // Store Access
    const { activeTool, brushColor, brushSize, isMapLocked, isFogEnabled } = useMapToolStore();

    // Viewport State
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    // Pass FPS and Debug Info
    useEffect(() => {
        if (onDebugUpdate) {
            onDebugUpdate({ scale, x: stagePos.x, y: stagePos.y, px: undefined as any, py: undefined as any, fps });
        }
    }, [fps]);

    useEffect(() => {
        let frameId: number;
        const loop = () => {
            const now = performance.now();
            const delta = now - lastTimeRef.current;
            frameCountRef.current++;

            if (delta >= 1000) {
                setFps(Math.round((frameCountRef.current * 1000) / delta));
                frameCountRef.current = 0;
                lastTimeRef.current = now;
            }
            frameId = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(frameId);
    }, []);

    // Center on Load
    const hasCenteredRef = useRef(false);
    useEffect(() => {
        if (dimensions.width > 0 && dimensions.height > 0 && !hasCenteredRef.current) {
            setStagePos({
                x: dimensions.width / 2,
                y: dimensions.height / 2
            });
            hasCenteredRef.current = true;
        }
    }, [dimensions.width, dimensions.height]);

    // Drawing State
    const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
    const isDrawing = useRef(false);
    const lastPointerPos = useRef<{ x: number, y: number } | null>(null);

    // Selection State
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Measurement State
    const [measureState, setMeasureState] = useState<{ start: { x: number, y: number }, end: { x: number, y: number }, finalized: boolean } | null>(null);

    // Cursor State
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Reset measurement when tool changes
    useEffect(() => {
        if (activeTool !== 'measure') {
            setMeasureState(null);
        }
    }, [activeTool]);

    // Helpers
    const checkDeselect = (e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => {
        const target = e.target;
        const isStage = target === target.getStage();
        const isBackground = target.name() === 'background';
        if (activeTool === 'measure') setSelectedId(null);
        if ((isStage || isBackground) && activeTool === 'select') setSelectedId(null);
    };



    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const scaleBy = 1.1;
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const finalScale = Math.max(0.1, Math.min(newScale, 10));

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newPos = {
            x: pointer.x - mousePointTo.x * finalScale,
            y: pointer.y - mousePointTo.y * finalScale,
        };

        setStagePos(newPos);
        setScale(finalScale);
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current;
        if (!stage) return;

        const ptr = stage.getPointerPosition();
        if (!ptr) {
            setCursorPos(null);
            return;
        }

        // Transform pointer to local stage coordinates for the cursor shape
        const x = (ptr.x - stagePos.x) / scale;
        const y = (ptr.y - stagePos.y) / scale;

        setCursorPos({ x, y });

        // Debug Broadcast - Throttled to ~30fps roughly (32ms) to prevent React Thrashing
        const now = performance.now();
        if (onDebugUpdate && (now - lastDebugUpdateTimeRef.current) > 32) {
            onDebugUpdate({
                scale,
                x: stagePos.x,
                y: stagePos.y,
                px: ptr.x,
                py: ptr.y
            });
            lastDebugUpdateTimeRef.current = now;
        }

        // Handle Middle Mouse Pan
        if (e.evt.buttons === 4) {
            if (lastPointerPos.current) {
                const dx = ptr.x - lastPointerPos.current.x;
                const dy = ptr.y - lastPointerPos.current.y;
                setStagePos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            }
            lastPointerPos.current = ptr;
            return;
        }

        // Handle Measure Move
        if (activeTool === 'measure' && measureState && !measureState.finalized) {
            setMeasureState(prev => prev ? { ...prev, end: { x, y } } : null);
            return;
        }

        // Handle Drawing Move (Brush, Erase, Fog)
        if (!isDrawing.current || !currentLine) {
            lastPointerPos.current = ptr;
            return;
        }

        // If Rectangle Shape, we update the Last Point (Index 2,3) instead of appending
        if (currentLine.shape === 'rectangle') {
            setCurrentLine(prev => prev ? {
                ...prev,
                points: [prev.points[0], prev.points[1], x, y]
            } : null);
        } else {
            // Freehand: Append
            setCurrentLine(prev => prev ? {
                ...prev,
                points: [...prev.points, x, y]
            } : null);
        }

        lastPointerPos.current = ptr;
    };



    const handleMouseLeave = () => {
        isDrawing.current = false;
        lastPointerPos.current = null;
        setCursorPos(null);
        if (currentLine) {
            if (currentLine.tool === 'fog-reveal' || currentLine.tool === 'fog-shroud') {
                const newFogLines = [...fogLines, currentLine];
                onFogChange(newFogLines);
            } else {
                const newLines = [...lines, currentLine];
                onLinesChange(newLines);
            }
            setCurrentLine(null);
        }
    };

    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current;
        if (!stage) return;
        const ptr = stage.getPointerPosition();
        if (!ptr) return;

        lastPointerPos.current = ptr;

        // Middle Click Pan Start
        if (e.evt.button === 1) {
            e.evt.preventDefault(); // Prevent scroll cursor
            return;
        }

        // Measure Tool
        if (activeTool === 'measure' && e.evt.button === 0) {
            const x = (ptr.x - stagePos.x) / scale;
            const y = (ptr.y - stagePos.y) / scale;

            setMeasureState(prev => {
                if (!prev || prev.finalized) {
                    // Start new measurement
                    return {
                        start: { x, y },
                        end: { x, y },
                        finalized: false
                    };
                } else {
                    // Finalize measurement
                    return {
                        ...prev,
                        end: { x, y },
                        finalized: true
                    };
                }
            });
            return;
        }

        // Left Click Drawing (Brush, Erase, Fog)
        const isBrush = activeTool === 'brush';
        const isErase = activeTool === 'erase';
        const isFogReveal = activeTool === 'fog-reveal';
        const isFogShroud = activeTool === 'fog-shroud';

        if ((isBrush || isErase || isFogReveal || isFogShroud) && e.evt.button === 0) {
            isDrawing.current = true;
            const x = (ptr.x - stagePos.x) / scale;
            const y = (ptr.y - stagePos.y) / scale;

            let stroke = brushColor;
            let strokeWidth = brushSize;
            let tool = activeTool;

            if (isErase) {
                stroke = '#000000'; // Doesn't matter for destination-out
                strokeWidth = brushSize * 2;
                tool = 'erase';
            } else if (isFogReveal) {
                stroke = '#000000'; // Doesn't matter for destination-out
                tool = 'fog-reveal';
            } else if (isFogShroud) {
                stroke = '#000000'; // Fog is black?
                tool = 'fog-shroud';
            } else {
                tool = 'brush';
            }

            // Get current shape from store (we need to access it inside the component, likely via store hook)
            // But we didn't destructure `drawingShape` yet.
            // Accessing directly from store state for freshness or adding to destructure list.
            const shape = useMapToolStore.getState().drawingShape;

            setCurrentLine({
                points: shape === 'rectangle' ? [x, y, x, y] : [x, y], // Rect starts as point
                stroke,
                strokeWidth,
                tool: tool as any,
                shape: shape as any // 'freehand' | 'rectangle'
            });
        }
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
        lastPointerPos.current = null;
        if (currentLine) {
            if (currentLine.tool === 'fog-reveal' || currentLine.tool === 'fog-shroud') {
                const newFogLines = [...fogLines, currentLine];
                onFogChange(newFogLines);
            } else {
                const newLines = [...lines, currentLine];
                onLinesChange(newLines);
            }
            setCurrentLine(null);
        }
    };

    // Grid Renderer (Optimized with Shape)
    const renderBackground = () => (
        <Layer id="background-layer">
            <Rect
                x={-5000}
                y={-5000}
                width={10000}
                height={10000}
                fill="#99C4E3"
                name="background"
                listening={true}
            />
        </Layer>
    );

    const renderGridLines = () => {
        if (gridSettings.type === 'none') return null;

        const gridSize = 20 * gridSettings.scale;

        // Render range (large enough to cover map)
        const range = 5000;
        const start = -range;
        const end = range;

        if (gridSettings.type === 'square') {
            return (
                <Layer id="grid-layer" listening={false}>
                    <Shape
                        sceneFunc={(context, shape) => {
                            context.beginPath();
                            context.lineWidth = 1;
                            context.strokeStyle = "rgba(0,0,0,0.5)";

                            // Vertical
                            for (let x = start; x <= end; x += gridSize) {
                                context.moveTo(x, start);
                                context.lineTo(x, end);
                            }
                            // Horizontal
                            for (let y = start; y <= end; y += gridSize) {
                                context.moveTo(start, y);
                                context.lineTo(end, y);
                            }
                            context.stroke();

                            // Center Markers (Red)
                            context.beginPath();
                            context.lineWidth = 2;
                            context.strokeStyle = "#ef4444";
                            context.moveTo(-50, 0);
                            context.lineTo(50, 0);
                            context.moveTo(0, -50);
                            context.lineTo(0, 50);
                            context.stroke();
                        }}
                        listening={false}
                    />
                </Layer>
            );
        }

        if (gridSettings.type === 'hex') {
            const size = gridSize / Math.sqrt(3);
            const width = gridSize;
            const rowHeight = 1.5 * size;

            return (
                <Layer id="grid-layer" listening={false}>
                    <Shape
                        sceneFunc={(context, shape) => {
                            context.beginPath();
                            context.lineWidth = 1;
                            context.strokeStyle = "rgba(0,0,0,0.5)";

                            const cols = Math.ceil(range * 2 / width);
                            const rows = Math.ceil(range * 2 / rowHeight);

                            // Hexagon Point Helper
                            const drawHex = (cx: number, cy: number) => {
                                for (let i = 0; i < 6; i++) {
                                    const angle_deg = 60 * i - 30;
                                    const angle_rad = Math.PI / 180 * angle_deg;
                                    const px = cx + size * Math.cos(angle_rad);
                                    const py = cy + size * Math.sin(angle_rad);
                                    if (i === 0) context.moveTo(px, py);
                                    else context.lineTo(px, py);
                                }
                                context.closePath();
                            }

                            for (let r = 0; r < rows; r++) {
                                for (let c = 0; c < cols; c++) {
                                    const xOffset = (r % 2 === 1) ? width / 2 : 0;
                                    const cx = start + c * width + xOffset;
                                    const cy = start + r * rowHeight;

                                    // Cull
                                    if (cx < -range || cx > range || cy < -range || cy > range) continue;

                                    drawHex(cx, cy);
                                }
                            }
                            context.stroke();

                            // Center Markers
                            context.beginPath();
                            context.lineWidth = 2;
                            context.strokeStyle = "#ef4444";
                            context.moveTo(-50, 0);
                            context.lineTo(50, 0);
                            context.moveTo(0, -50);
                            context.lineTo(0, 50);
                            context.stroke();
                        }}
                        listening={false}
                    />
                </Layer>
            );
        }

        return null;
    };

    // --- Interaction Handlers ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        stage.setPointersPositions(e);
        const ptr = stage.getPointerPosition();
        if (!ptr) return;

        // Convert to World Coords
        const x = (ptr.x - stagePos.x) / scale;
        const y = (ptr.y - stagePos.y) / scale;

        const newTokens = [...tokens];

        // Handle File Drop (Images)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            Array.from(e.dataTransfer.files).forEach((file: any) => { // Cast to any to access .path
                if (file.type.startsWith('image/')) {
                    // Electron exposes .path on File objects
                    const path = file.path;
                    let src = '';

                    if (path) {
                        const normalizedPath = path.replace(/\\/g, '/');
                        // media:///C:/path or media:///path
                        if (normalizedPath.startsWith('/')) {
                            src = `media://${normalizedPath}`;
                        } else {
                            src = `media:///${normalizedPath}`;
                        }
                    } else {
                        src = URL.createObjectURL(file);
                    }

                    newTokens.push({
                        id: crypto.randomUUID(),
                        x,
                        y,
                        src,
                        type: 'token',
                        zLevel: 30, // MapLayers.OBJECTS.min
                        width: 100, // Default size
                        height: 100
                    });
                }
            });
        }

        // Handle Node Drop (Pins)
        const nodeData = e.dataTransfer.getData('application/tapestry-node');
        if (nodeData) {
            try {
                const node = JSON.parse(nodeData);
                newTokens.push({
                    id: crypto.randomUUID(),
                    x,
                    y,
                    src: '',
                    type: 'pin',
                    zLevel: 60, // MapLayers.MARKERS.min
                    width: 20,
                    height: 20,
                    linkedEntryId: node.id,
                    label: node.title || 'Untitled Entry',
                    blurb: node.blurb // Assuming dropped node has blurb, if not, we might need to fetch it or leave empty
                });
            } catch (err) {
                console.error('Failed to parse dropped node', err);
            }
        }

        if (newTokens.length > tokens.length) {
            onTokensChange(newTokens);
        }
    };

    // Cursor Renderer
    const renderCursor = () => {
        if (!cursorPos || activeTool === 'pan' || activeTool === 'select') return null;

        const isErase = activeTool === 'erase';
        const radius = isErase ? brushSize : brushSize / 2;

        return (
            <Layer>
                <Circle
                    x={cursorPos.x}
                    y={cursorPos.y}
                    radius={radius}
                    stroke="#000000"
                    strokeWidth={1 / scale}
                    fill={isErase ? 'rgba(255, 255, 255, 0.5)' : brushColor}
                    opacity={0.5}
                    listening={false}
                />
                {/* Contrast ring */}
                <Circle
                    x={cursorPos.x}
                    y={cursorPos.y}
                    radius={radius}
                    stroke="#ffffff"
                    strokeWidth={1 / scale}
                    listening={false}
                    opacity={0.5}
                />
            </Layer>
        );
    };



    const renderMeasurement = () => {
        if (!measureState) return null;

        const { start, end } = measureState;

        // Calculate Distance
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distPixels = Math.sqrt(dx * dx + dy * dy);

        // Convert to Units
        // 1 Unit = 100 * gridSettings.scale pixels
        const pixelsPerUnit = 100 * gridSettings.scale;
        const units = (distPixels / pixelsPerUnit) * gridSettings.unitNumber;

        // Format Label
        const label = `${units.toFixed(1)} ${gridSettings.unitType}`;

        // Perpendicular Ticks
        const len = distPixels || 1; // Avoid divide by zero
        const pnx = -dy / len;
        const pny = dx / len;

        const tickSize = 10 / scale;

        const startTick = [
            start.x + pnx * tickSize, start.y + pny * tickSize,
            start.x - pnx * tickSize, start.y - pny * tickSize
        ];

        const endTick = [
            end.x + pnx * tickSize, end.y + pny * tickSize,
            end.x - pnx * tickSize, end.y - pny * tickSize
        ];

        // Midpoint for text
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        const offset = 15 / scale; // Offset text above line

        return (
            <Layer id="measure-layer">
                {/* Main Line */}
                <Line
                    points={[start.x, start.y, end.x, end.y]}
                    stroke="rgba(255, 255, 255, 0.75)"
                    strokeWidth={2 / scale}
                    dash={[10 / scale, 5 / scale]}
                />
                {/* Start Tick */}
                <Line
                    points={startTick}
                    stroke="rgba(255, 255, 255, 0.75)"
                    strokeWidth={2 / scale}
                />
                {/* End Tick */}
                <Line
                    points={endTick}
                    stroke="rgba(255, 255, 255, 0.75)"
                    strokeWidth={2 / scale}
                />
                <Text
                    x={mx + pnx * offset}
                    y={my + pny * offset}
                    text={label}
                    fontSize={14 / scale}
                    fill="rgba(255, 255, 255, 0.9)"
                    align="center"
                    verticalAlign="middle"
                    offsetX={50}
                />
            </Layer>
        );
    };

    // Keyboard Listeners (Delete & Escape)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedId) return;

            if (e.key === 'Escape') {
                setSelectedId(null);
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const newTokens = tokens.filter(t => t.id !== selectedId);
                onTokensChange(newTokens);
                setSelectedId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, tokens, onTokensChange]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-slate-950 overflow-hidden relative"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                onWheel={handleWheel}

                // Interaction Handlers
                onMouseDown={(e) => {
                    checkDeselect(e);
                    handleMouseDown(e);
                }}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={checkDeselect}

                // Draggable only in Pan mode
                draggable={activeTool === 'pan'}
                onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                    // Only update stage pos if it's the stage dragging
                    if (e.target === stageRef.current) {
                        setStagePos({ x: e.target.x(), y: e.target.y() });
                    }
                }}

                x={stagePos.x}
                y={stagePos.y}
                scaleX={scale}
                scaleY={scale}
                style={{
                    cursor: activeTool === 'pan' ? 'grab'
                        : (activeTool === 'brush' || activeTool === 'erase') ? 'none'
                            : 'default'
                }}
            >
                {/* --- LAYER 0: BACKGROUND (Color) --- */}
                {renderBackground()}

                {/* --- LAYER 1: TOKENS & PINS --- */}
                <Layer id="token-layer">
                    {tokens
                        .filter(t => t.zLevel >= 0 && t.zLevel < 100) // Render all tokens
                        .sort((a, b) => a.zLevel - b.zLevel) // Sort by Z-level
                        .map(token => {
                            if (token.type === 'pin') {
                                return (
                                    <MapPin
                                        key={token.id}
                                        token={token}
                                        isSelected={token.id === selectedId}
                                        onSelect={() => {
                                            if (activeTool === 'select') {
                                                setSelectedId(token.id);
                                            }
                                        }}
                                        onChange={(newToken) => {
                                            const newTokens = tokens.map(t => t.id === newToken.id ? newToken : t)
                                            onTokensChange(newTokens);
                                        }}
                                        onClick={() => {
                                            if (token.linkedEntryId && onOpenEntry) {
                                                onOpenEntry(token.linkedEntryId);
                                            }
                                        }}
                                        onContextMenu={(e) => {
                                            e.evt.preventDefault();
                                            if (onTokenContextMenu) {
                                                onTokenContextMenu(e, token);
                                            }
                                        }}
                                    />
                                );
                            }

                            return (
                                <URLImage
                                    key={token.id}
                                    token={token}
                                    isSelected={token.id === selectedId}
                                    onSelect={() => {
                                        if (activeTool === 'select') {
                                            setSelectedId(token.id);
                                        }
                                    }}
                                    onChange={(newToken) => {
                                        // Use reference from updateToken or inline
                                        const newTokens = tokens.map((t) => (t.id === newToken.id ? newToken : t));
                                        onTokensChange(newTokens);
                                    }}
                                    draggable={!isMapLocked && activeTool === 'select'}
                                    listening={!isMapLocked}
                                />
                            );
                        })}
                </Layer>

                {/* --- LAYER 1.5: GRID LINES --- */}
                {renderGridLines()}

                {/* --- LAYER 1.6: MEASUREMENT --- */}
                {renderMeasurement()}

                {/* --- LAYER 2: SURFACE (Drawings) --- */}
                <Layer id="surface-layer">
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={line.stroke}
                            strokeWidth={line.strokeWidth}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={
                                line.tool === 'erase' ? 'destination-out' : 'source-over'
                            }
                        />
                    ))}
                    {currentLine && (
                        <Line
                            points={currentLine.points}
                            stroke={currentLine.stroke}
                            strokeWidth={currentLine.strokeWidth}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={
                                currentLine.tool === 'erase' ? 'destination-out' : 'source-over'
                            }
                        />
                    )}
                </Layer>

                {/* --- LAYER 3: OBJECTS (Tokens) --- */}


                {/* --- LAYER 3.5: MARKERS (Pins) - REMOVED (Handled in Token Layer) --- */}

                {/* --- LAYER 4: ATMOSPHERE (Fog of War) --- */}
                {/* --- LAYER 4: ATMOSPHERE (Fog of War) --- */}
                {/* 
                    If Fog is disabled, we hide the layer. 
                    If enabled, we render it with global opacity.
                */}
                <Layer id="fog-layer" listening={false} visible={isFogEnabled} opacity={0.9}>
                    <Rect
                        x={-5000}
                        y={-5000}
                        width={10000}
                        height={10000}
                        fill="#000000"
                        // Opacity is now on the Layer to ensure Shroud lines match Base Fog
                        listening={false}
                    />
                    {fogLines.map((line, i) => {
                        if (line.shape === 'rectangle' && line.points.length === 4) {
                            const [x1, y1, x2, y2] = line.points;
                            return (
                                <Rect
                                    key={i}
                                    x={Math.min(x1, x2)}
                                    y={Math.min(y1, y2)}
                                    width={Math.abs(x2 - x1)}
                                    height={Math.abs(y2 - y1)}
                                    fill={line.tool === 'fog-shroud' ? '#000000' : '#000000'}
                                    globalCompositeOperation={
                                        line.tool === 'fog-reveal' ? 'destination-out' : 'source-over'
                                    }
                                />
                            );
                        }
                        return (
                            <Line
                                key={i}
                                points={line.points}
                                stroke="#000000"
                                strokeWidth={line.strokeWidth}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation={
                                    line.tool === 'fog-reveal' ? 'destination-out' : 'source-over'
                                }
                            />
                        );
                    })}
                    {currentLine && (currentLine.tool === 'fog-reveal' || currentLine.tool === 'fog-shroud') && (
                        currentLine.shape === 'rectangle' && currentLine.points.length >= 4 ? (
                            <Rect
                                x={Math.min(currentLine.points[0], currentLine.points[2])}
                                y={Math.min(currentLine.points[1], currentLine.points[3])}
                                width={Math.abs(currentLine.points[2] - currentLine.points[0])}
                                height={Math.abs(currentLine.points[3] - currentLine.points[1])}
                                fill="#000000"
                                globalCompositeOperation={
                                    currentLine.tool === 'fog-reveal' ? 'destination-out' : 'source-over'
                                }
                            />
                        ) : (
                            <Line
                                points={currentLine.points}
                                stroke="#000000"
                                strokeWidth={currentLine.strokeWidth}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation={
                                    currentLine.tool === 'fog-reveal' ? 'destination-out' : 'source-over'
                                }
                            />
                        )
                    )}
                </Layer>

                {/* --- LAYER 5: INTERFACE (Cursor & Gizmos) --- */}
                {renderCursor()}

                {children}
            </Stage>
        </div>
    );
}

export const MapCanvas = React.memo(MapCanvasComponent);
