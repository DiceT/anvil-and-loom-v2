import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useMapToolStore } from '../../stores/useMapToolStore';

export interface DrawingLine {
    points: number[];
    stroke: string;
    strokeWidth: number;
    tool?: 'brush' | 'erase';
}

interface MapCanvasProps {
    children?: React.ReactNode;
    lines: DrawingLine[];
    onLinesChange: (lines: DrawingLine[]) => void;
    onDebugUpdate?: (data: { scale: number; x: number; y: number; px: number; py: number }) => void;
}

export function MapCanvas({ children, lines, onLinesChange, onDebugUpdate }: MapCanvasProps) {
    const stageRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Store Access
    const { activeTool, brushColor, brushSize } = useMapToolStore();

    // Viewport State
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    // Drawing State (Local current line only)
    const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
    const isDrawing = useRef(false);
    const lastPointerPos = useRef<{ x: number, y: number } | null>(null);

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

    // Cursor State
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current;
        if (!stage) return;

        const ptr = stage.getPointerPosition();
        if (!ptr) {
            setCursorPos(null);
            return;
        }

        // Transform pointer to local stage coordinates for the cursor shape
        // The cursor shape will live in the world space (so it scales with zoom)
        // effectively showing the "Map Unit" size of the brush.
        const x = (ptr.x - stagePos.x) / scale;
        const y = (ptr.y - stagePos.y) / scale;

        setCursorPos({ x, y });

        // Debug Broadcast
        if (onDebugUpdate) {
            onDebugUpdate({
                scale,
                x: stagePos.x,
                y: stagePos.y,
                px: ptr.x,
                py: ptr.y
            });
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

        // Handle Drawing Move
        if (!isDrawing.current || !currentLine) {
            lastPointerPos.current = ptr;
            return;
        }

        setCurrentLine(prev => prev ? {
            ...prev,
            points: [...prev.points, x, y]
        } : null);

        lastPointerPos.current = ptr;
    };

    const handleMouseLeave = () => {
        isDrawing.current = false;
        lastPointerPos.current = null;
        setCursorPos(null);
        if (currentLine) {
            const newLines = [...lines, currentLine];
            onLinesChange(newLines);
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

        // Left Click Drawing (Brush or Erase)
        const isBrush = activeTool === 'brush';
        const isErase = activeTool === 'erase';

        if ((isBrush || isErase) && e.evt.button === 0) {
            isDrawing.current = true;
            const x = (ptr.x - stagePos.x) / scale;
            const y = (ptr.y - stagePos.y) / scale;

            setCurrentLine({
                points: [x, y],
                stroke: isErase ? '#000000' : brushColor,
                strokeWidth: isErase ? brushSize * 2 : brushSize, // Eraser usually larger
                tool: isErase ? 'erase' : 'brush'
            });
        }
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
        lastPointerPos.current = null;
        if (currentLine) {
            const newLines = [...lines, currentLine];
            onLinesChange(newLines);
            setCurrentLine(null);
        }
    };

    // Grid Renderer
    const renderGrid = () => (
        <Layer>
            <Rect x={-5000} y={-5000} width={10000} height={10000} fill="#99C4E3" />
            {Array.from({ length: 100 }).map((_, i) => {
                const pos = i * 100 - 5000;
                return (
                    <Line
                        key={`v-${i}`}
                        points={[pos, -5000, pos, 5000]}
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth={1}
                    />
                );
            })}
            {Array.from({ length: 100 }).map((_, i) => {
                const pos = i * 100 - 5000;
                return (
                    <Line
                        key={`h-${i}`}
                        points={[-5000, pos, 5000, pos]}
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth={1}
                    />
                );
            })}
            <Line points={[-50, 0, 50, 0]} stroke="#ef4444" strokeWidth={2} />
            <Line points={[0, -50, 0, 50]} stroke="#ef4444" strokeWidth={2} />
        </Layer>
    );

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

    return (
        <div ref={containerRef} className="w-full h-full bg-slate-950 overflow-hidden relative">
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                onWheel={handleWheel}

                // Interaction Handlers
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}

                // Draggable only in Pan mode
                draggable={activeTool === 'pan'}
                onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                    setStagePos({ x: e.target.x(), y: e.target.y() });
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
                {/* --- LAYER 1: BASE (Grid & Background) --- */}
                {renderGrid()}

                {/* --- LAYER 2: SURFACE (Drawings & Tokens) --- */}
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
                {/* Placeholder: Tokens will go here */}

                {/* --- LAYER 4: ATMOSPHERE (Fog of War) --- */}
                {/* Placeholder: Fog will go here */}

                {/* --- LAYER 5: INTERFACE (Cursor & Gizmos) --- */}
                {renderCursor()}

                {children}
            </Stage>
        </div>
    );
}
