import React, { useRef, useEffect, useState } from 'react';

type SpawnDirection = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface BoundsEditorOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (bounds: { width: number; depth: number; offsetX: number; offsetZ: number }, direction: SpawnDirection) => void;
    initialBounds: { width: number; depth: number; offsetX: number; offsetZ: number };
    initialDirection: SpawnDirection;
    containerRef: React.RefObject<HTMLDivElement | null>;
    viewHeight: number; // World units visible vertically
}

export function BoundsEditorOverlay({
    isOpen,
    onClose,
    onConfirm,
    initialBounds,
    initialDirection,
    containerRef,
    viewHeight
}: BoundsEditorOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bounds, setBounds] = useState(initialBounds);
    const [direction, setDirection] = useState<SpawnDirection>(initialDirection);
    const [dragging, setDragging] = useState<'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'move' | null>(null);
    const [dragStart, setDragStart] = useState<{ x: number; z: number } | null>(null);
    const [moveStartClick, setMoveStartClick] = useState<{ x: number; y: number } | null>(null);


    // Draw the hazard pattern
    useEffect(() => {
        if (!isOpen || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const container = containerRef.current;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const canvasCenterX = canvas.width / 2;
        const canvasCenterY = canvas.height / 2;

        // Calculate bounds in screen space
        const screenHeight = canvas.height;

        // World units to screen conversion
        const pixelsPerUnit = screenHeight / viewHeight;
        const boundsScreenW = bounds.width * pixelsPerUnit;
        const boundsScreenH = bounds.depth * pixelsPerUnit;

        // Apply offset in screen space (X maps to X, Z maps to Y)
        const offsetScreenX = bounds.offsetX * pixelsPerUnit;
        const offsetScreenY = bounds.offsetZ * pixelsPerUnit;

        const centerX = canvasCenterX + offsetScreenX;
        const centerY = canvasCenterY + offsetScreenY;

        const left = centerX - boundsScreenW / 2;
        const right = centerX + boundsScreenW / 2;
        const top = centerY - boundsScreenH / 2;
        const bottom = centerY + boundsScreenH / 2;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw semi-transparent overlay OUTSIDE the bounds
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, top); // Top strip
        ctx.fillRect(0, bottom, canvas.width, canvas.height - bottom); // Bottom strip
        ctx.fillRect(0, top, left, boundsScreenH); // Left strip
        ctx.fillRect(right, top, canvas.width - right, boundsScreenH); // Right strip

        // Draw hazard stripes inside bounds
        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, boundsScreenW, boundsScreenH);
        ctx.clip();

        // Diagonal yellow stripes
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.4)';
        ctx.lineWidth = 8;
        const stripeSpacing = 30;

        for (let i = -canvas.width; i < canvas.width + canvas.height; i += stripeSpacing) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + canvas.height, canvas.height);
            ctx.stroke();
        }

        ctx.restore();

        // Red border
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 4;
        ctx.strokeRect(left, top, boundsScreenW, boundsScreenH);

        // Drag handles (larger, more visible squares on each edge)
        const handleSize = 28;
        const handlePadding = 20; // Keep handles visible on screen

        // Clamp position to visible canvas area
        const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
        const clampX = (x: number) => clamp(x, handlePadding, canvas.width - handlePadding);
        const clampY = (y: number) => clamp(y, handlePadding, canvas.height - handlePadding);

        // Draw handle with border for visibility
        const drawHandle = (hx: number, hy: number, isCorner: boolean = false) => {
            const cx = clampX(hx);
            const cy = clampY(hy);

            // Different color for corners
            ctx.fillStyle = isCorner ? '#ff6600' : '#ff3333';
            ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
        };

        // Edge handles (clamped to visible area)
        drawHandle(centerX, top, false);      // Top
        drawHandle(centerX, bottom, false);   // Bottom
        drawHandle(left, centerY, false);     // Left
        drawHandle(right, centerY, false);    // Right

        // Corner handles (for diagonal directions) - orange color
        drawHandle(left, top, true);         // Top-Left
        drawHandle(right, top, true);        // Top-Right
        drawHandle(left, bottom, true);      // Bottom-Left
        drawHandle(right, bottom, true);     // Bottom-Right

        // Direction arrow
        ctx.fillStyle = '#00ff88';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 4;

        const drawArrow = (fromX: number, fromY: number, toX: number, toY: number) => {
            const headLen = 18;
            const angle = Math.atan2(toY - fromY, toX - fromX);

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();

            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
        };

        // Draw arrow based on direction
        const arrowOffset = 50;
        switch (direction) {
            case 'right':
                drawArrow(right - arrowOffset, centerY, centerX, centerY);
                break;
            case 'left':
                drawArrow(left + arrowOffset, centerY, centerX, centerY);
                break;
            case 'bottom':
                drawArrow(centerX, bottom - arrowOffset, centerX, centerY);
                break;
            case 'top':
                drawArrow(centerX, top + arrowOffset, centerX, centerY);
                break;
            case 'top-left':
                drawArrow(left + arrowOffset * 0.7, top + arrowOffset * 0.7, centerX, centerY);
                break;
            case 'top-right':
                drawArrow(right - arrowOffset * 0.7, top + arrowOffset * 0.7, centerX, centerY);
                break;
            case 'bottom-left':
                drawArrow(left + arrowOffset * 0.7, bottom - arrowOffset * 0.7, centerX, centerY);
                break;
            case 'bottom-right':
                drawArrow(right - arrowOffset * 0.7, bottom - arrowOffset * 0.7, centerX, centerY);
                break;
        }

    }, [isOpen, bounds, direction, viewHeight, containerRef]);

    // Handle resize on window resize
    useEffect(() => {
        if (!isOpen) return;

        const handleResize = () => {
            // Trigger redraw
            setBounds(b => ({ ...b }));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen]);

    // Mouse handlers for dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Scale mouse coordinates to canvas coordinates
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const pixelsPerUnit = canvas.height / viewHeight;
        const boundsScreenW = bounds.width * pixelsPerUnit;
        const boundsScreenH = bounds.depth * pixelsPerUnit;

        const left = centerX - boundsScreenW / 2;
        const right = centerX + boundsScreenW / 2;
        const top = centerY - boundsScreenH / 2;
        const bottom = centerY + boundsScreenH / 2;

        // Same clamping as drawing
        const handlePadding = 20;
        const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
        const clampedLeft = clamp(left, handlePadding, canvas.width - handlePadding);
        const clampedRight = clamp(right, handlePadding, canvas.width - handlePadding);
        const clampedTop = clamp(top, handlePadding, canvas.height - handlePadding);
        const clampedBottom = clamp(bottom, handlePadding, canvas.height - handlePadding);

        const handleSize = 40; // Larger hit area

        // Check corner handles first (they overlap with edge handles)
        if (Math.abs(x - clampedLeft) < handleSize && Math.abs(y - clampedTop) < handleSize) {
            setDragging('top-left');
        } else if (Math.abs(x - clampedRight) < handleSize && Math.abs(y - clampedTop) < handleSize) {
            setDragging('top-right');
        } else if (Math.abs(x - clampedLeft) < handleSize && Math.abs(y - clampedBottom) < handleSize) {
            setDragging('bottom-left');
        } else if (Math.abs(x - clampedRight) < handleSize && Math.abs(y - clampedBottom) < handleSize) {
            setDragging('bottom-right');
            // Then check edge handles
        } else if (Math.abs(y - clampedTop) < handleSize && Math.abs(x - centerX) < handleSize * 2) {
            setDragging('top');
        } else if (Math.abs(y - clampedBottom) < handleSize && Math.abs(x - centerX) < handleSize * 2) {
            setDragging('bottom');
        } else if (Math.abs(x - clampedLeft) < handleSize && Math.abs(y - centerY) < handleSize * 2) {
            setDragging('left');
        } else if (Math.abs(x - clampedRight) < handleSize && Math.abs(y - centerY) < handleSize * 2) {
            setDragging('right');
        } else if (x > left && x < right && y > top && y < bottom) {
            // Clicked inside bounds - start move
            setDragging('move');
            setDragStart({ x: bounds.offsetX, z: bounds.offsetZ });
            setMoveStartClick({ x, y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Scale mouse coordinates to canvas coordinates
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const pixelsPerUnit = canvas.height / viewHeight;

        setBounds(prev => {
            let newBounds = { ...prev };
            const minSize = 10; // Minimum 10 world units

            switch (dragging) {
                case 'top': {
                    const distFromCenter = centerY - y;
                    const newDepth = Math.max(minSize, (distFromCenter * 2) / pixelsPerUnit);
                    newBounds.depth = newDepth;
                    break;
                }
                case 'bottom': {
                    const distFromCenter = y - centerY;
                    const newDepth = Math.max(minSize, (distFromCenter * 2) / pixelsPerUnit);
                    newBounds.depth = newDepth;
                    break;
                }
                case 'left': {
                    const distFromCenter = centerX - x;
                    const newWidth = Math.max(minSize, (distFromCenter * 2) / pixelsPerUnit);
                    newBounds.width = newWidth;
                    break;
                }
                case 'right': {
                    const distFromCenter = x - centerX;
                    const newWidth = Math.max(minSize, (distFromCenter * 2) / pixelsPerUnit);
                    newBounds.width = newWidth;
                    break;
                }
                // Corner handles resize both dimensions
                case 'top-left':
                case 'top-right':
                case 'bottom-left':
                case 'bottom-right': {
                    const distX = Math.abs(x - centerX);
                    const distY = Math.abs(y - centerY);
                    newBounds.width = Math.max(minSize, (distX * 2) / pixelsPerUnit);
                    newBounds.depth = Math.max(minSize, (distY * 2) / pixelsPerUnit);
                    break;
                }
                case 'move': {
                    // Calculate delta from initial click position
                    if (moveStartClick && dragStart) {
                        const deltaX = (x - moveStartClick.x) / pixelsPerUnit;
                        const deltaY = (y - moveStartClick.y) / pixelsPerUnit;
                        newBounds.offsetX = dragStart.x + deltaX;
                        newBounds.offsetZ = dragStart.z + deltaY;
                    }
                    break;
                }
            }

            return newBounds;
        });
    };

    const handleMouseUp = () => {
        setDragging(null);
        setDragStart(null);
        setMoveStartClick(null);
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 100,
                cursor: dragging ? 'grabbing' : 'default'
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
            />

            {/* Controls overlay */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.85)',
                borderRadius: '12px',
                padding: '15px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center',
                color: 'white',
                fontFamily: 'sans-serif',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Roll Area Editor</div>

                {/* Direction buttons - 3x3 grid */}
                <div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', textAlign: 'center' }}>Dice spawn from:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', width: '120px' }}>
                        {/* Row 1: TL, T, TR */}
                        {(['top-left', 'top', 'top-right'] as SpawnDirection[]).map(dir => (
                            <button
                                key={dir}
                                onClick={() => setDirection(dir)}
                                style={{
                                    padding: '8px',
                                    background: direction === dir ? '#4a90e2' : '#444',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                                title={`Dice enter from ${dir}`}
                            >
                                {dir === 'top-left' ? '↘' : dir === 'top' ? '↓' : '↙'}
                            </button>
                        ))}

                        {/* Row 2: L, center, R */}
                        <button
                            onClick={() => setDirection('left')}
                            style={{
                                padding: '8px',
                                background: direction === 'left' ? '#4a90e2' : '#444',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                            title="Dice enter from left"
                        >→</button>
                        <div style={{ background: '#222', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#666' }}>●</div>
                        <button
                            onClick={() => setDirection('right')}
                            style={{
                                padding: '8px',
                                background: direction === 'right' ? '#4a90e2' : '#444',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                            title="Dice enter from right"
                        >←</button>

                        {/* Row 3: BL, B, BR */}
                        {(['bottom-left', 'bottom', 'bottom-right'] as SpawnDirection[]).map(dir => (
                            <button
                                key={dir}
                                onClick={() => setDirection(dir)}
                                style={{
                                    padding: '8px',
                                    background: direction === dir ? '#4a90e2' : '#444',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                                title={`Dice enter from ${dir}`}
                            >
                                {dir === 'bottom-left' ? '↗' : dir === 'bottom' ? '↑' : '↖'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Size display */}
                <div style={{ fontSize: '12px', color: '#888' }}>
                    Size: {bounds.width.toFixed(0)} × {bounds.depth.toFixed(0)} units
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 20px',
                            background: '#666',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(bounds, direction)}
                        style={{
                            padding: '8px 20px',
                            background: '#4a90e2',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>

            {/* Help text */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '8px',
                padding: '10px 16px',
                color: '#aaa',
                fontSize: '12px',
                fontFamily: 'sans-serif'
            }}>
                Drag the red handles to resize the roll area
            </div>
        </div>
    );
}
