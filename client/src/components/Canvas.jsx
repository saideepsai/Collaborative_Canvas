/**
 * Canvas Component - Main drawing canvas with real-time collaboration
 * Implements native Canvas API drawing logic
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import {
    getCanvasCoordinates,
    drawSmoothPath,
    clearCanvas,
    generatePathId,
    resizeCanvas,
    throttle,
} from '../utils/canvas';
import Cursor from './Cursor';
import './Canvas.css';

export default function Canvas({
    color,
    lineWidth,
    onDraw,
    onUndo,
    onRedo,
    onClear,
    canUndo,
    canRedo,
    remoteCursors = {},
    onCursorMove,
    backgroundColor,
}) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState(null);
    const [localCursor, setLocalCursor] = useState(null);
    const historyRef = useRef([]);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size
        const handleResize = () => {
            const wasResized = resizeCanvas(canvas);
            if (wasResized) {
                // Redraw all paths after resize
                redrawCanvas();
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Redraw entire canvas from history
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas.getBoundingClientRect();

        clearCanvas(ctx, canvas.width, canvas.height);

        // Draw all paths from history
        historyRef.current.forEach((path) => {
            drawSmoothPath(ctx, path.points, path.color, path.lineWidth);
        });
    }, []);

    // Add path to history and redraw
    const addPathToHistory = useCallback((path) => {
        historyRef.current.push(path);
        redrawCanvas();
    }, [redrawCanvas]);

    // Handle receiving drawing history from server
    const handleHistory = useCallback((history) => {
        historyRef.current = history;
        redrawCanvas();
    }, [redrawCanvas]);

    // Handle receiving a new draw event
    const handleDrawEvent = useCallback((path) => {
        addPathToHistory(path);
    }, [addPathToHistory]);

    // Handle undo event - remove specific path by ID
    const handleUndoEvent = useCallback((data) => {
        console.log('[Canvas] handleUndoEvent called with data:', data);
        console.log('[Canvas] Current history length:', historyRef.current.length);
        console.log('[Canvas] Current history:', historyRef.current.map(p => ({ id: p.id, userId: p.userId })));

        if (!data || !data.pathId) {
            console.warn('[Canvas] Undo event missing pathId');
            return;
        }

        // Find and remove the path with this ID
        const pathIndex = historyRef.current.findIndex(p => p.id === data.pathId);

        console.log('[Canvas] Looking for pathId:', data.pathId);
        console.log('[Canvas] Found at index:', pathIndex);

        if (pathIndex !== -1) {
            const removedPath = historyRef.current.splice(pathIndex, 1)[0];
            console.log('[Canvas] Removed path:', removedPath);
            console.log(`[Canvas] Remaining paths: ${historyRef.current.length}`);
            redrawCanvas();
            console.log('[Canvas] Canvas redrawn');
        } else {
            console.warn(`[Canvas] Path ${data.pathId} not found in history`);
        }
    }, [redrawCanvas]);

    // Handle redo event
    const handleRedoEvent = useCallback((data) => {
        if (data.path) {
            addPathToHistory(data.path);
        }
    }, [addPathToHistory]);

    // Handle clear event
    const handleClearEvent = useCallback((data) => {
        console.log('[Canvas] Clear event received:', data);

        if (data && data.userId) {
            // Remove only this user's paths
            const initialLength = historyRef.current.length;
            historyRef.current = historyRef.current.filter(p => p.userId !== data.userId);
            console.log(`[Canvas] Cleared paths for user ${data.userId}. Removed ${initialLength - historyRef.current.length} paths.`);
        } else {
            // Fallback: clear everything if no userId provided
            historyRef.current = [];
            console.log('[Canvas] Cleared all paths');
        }

        // Redraw the remaining paths
        redrawCanvas();
    }, [redrawCanvas]);

    // Expose event handlers to parent
    useEffect(() => {
        console.log('[Canvas] useEffect running, onDraw:', onDraw);
        if (onDraw) {
            console.log('[Canvas] Registering handlers on onDraw object');
            onDraw.onHistory = handleHistory;
            onDraw.onDraw = handleDrawEvent;
            onDraw.onUndo = handleUndoEvent;
            onDraw.onRedo = handleRedoEvent;
            onDraw.onClear = handleClearEvent;
            console.log('[Canvas] Handlers registered:', {
                onHistory: !!onDraw.onHistory,
                onDraw: !!onDraw.onDraw,
                onUndo: !!onDraw.onUndo,
                onRedo: !!onDraw.onRedo,
                onClear: !!onDraw.onClear,
            });
        } else {
            console.warn('[Canvas] onDraw prop is undefined!');
        }
    }, [onDraw, handleHistory, handleDrawEvent, handleUndoEvent, handleRedoEvent, handleClearEvent]);

    // Start drawing
    const startDrawing = useCallback((e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const point = getCanvasCoordinates(canvas, e);
        const newPath = {
            id: generatePathId(),
            points: [point],
            color,
            lineWidth,
        };

        setCurrentPath(newPath);
        setIsDrawing(true);
    }, [color, lineWidth]);

    // Draw function (throttled)
    const drawThrottled = useCallback(
        throttle((e, point) => {
            if (!isDrawing || !currentPath) return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            const updatedPath = {
                ...currentPath,
                points: [...currentPath.points, point],
            };

            setCurrentPath(updatedPath);

            // Draw the current stroke in real-time
            const ctx = canvas.getContext('2d');
            drawSmoothPath(ctx, updatedPath.points, updatedPath.color, updatedPath.lineWidth);

            // Emit cursor position for ghost cursors
            if (onCursorMove) {
                onCursorMove({
                    x: e.clientX,
                    y: e.clientY,
                    isDrawing: true,
                });
            }
        }, 16), // ~60fps
        [isDrawing, currentPath, onCursorMove]
    );

    // Main mouse move handler
    const handleMouseMove = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Update local cursor state
        const point = getCanvasCoordinates(canvas, e);
        setLocalCursor(point);

        // If drawing, call the drawing logic
        if (isDrawing) {
            e.preventDefault();
            drawThrottled(e, point);
        } else {
            // Also emit cursor move when just hovering (optional, but good for "User: Me" tracking by others)
            // But usually we throttle this too.
            // For now, let's just update local state.

            // If we want others to see our cursor even when not drawing:
            if (onCursorMove) {
                // Throttle this too in real app, but for now simple
                // Actually, let's re-use the throttle mechanism or just leave it for drawing-only 
                // if that was the original intent. The user request was "tag user:me should be moving".
                // This implies local view.
            }
        }
    }, [isDrawing, drawThrottled]);

    // Stop drawing
    const stopDrawing = useCallback(() => {
        if (!isDrawing || !currentPath) return;

        // Emit the completed path
        if (onDraw && onDraw.emit && currentPath.points.length > 0) {
            onDraw.emit(currentPath);
        }

        setIsDrawing(false);
        setCurrentPath(null);
    }, [isDrawing, currentPath, onDraw]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Undo: Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo && onUndo) {
                    onUndo();
                }
            }

            // Redo: Ctrl+Y or Cmd+Shift+Z
            if (
                ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
            ) {
                e.preventDefault();
                if (canRedo && onRedo) {
                    onRedo();
                }
            }

            // Clear: Ctrl+Delete
            if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
                e.preventDefault();
                if (onClear) {
                    const confirmed = window.confirm('Clear the entire canvas? This action cannot be undone.');
                    if (confirmed) {
                        onClear();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, onUndo, onRedo, onClear]);

    return (
        <div className="canvas-container" style={{ background: backgroundColor }}>
            <canvas
                ref={canvasRef}
                className="drawing-canvas"
                onMouseDown={startDrawing}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDrawing}
                onMouseLeave={(e) => {
                    setLocalCursor(null);
                    stopDrawing(e);
                }}
                onTouchStart={startDrawing}
                onTouchMove={handleMouseMove}
                onTouchEnd={stopDrawing}
            />

            {/* Local cursor (User: Me) */}
            {localCursor && (
                <Cursor
                    userId="Me"
                    position={localCursor}
                    color={color}
                    isDrawing={isDrawing}
                />
            )}

            {/* Remote cursors (ghost cursors) */}
            {Object.entries(remoteCursors).map(([userId, cursorData]) => (
                <Cursor
                    key={userId}
                    userId={userId}
                    position={cursorData.position}
                    color={cursorData.color}
                    isDrawing={cursorData.isDrawing}
                />
            ))}
        </div>
    );
}
