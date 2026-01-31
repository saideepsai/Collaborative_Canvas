/**
 * App Component - Main application component
 * Orchestrates Canvas, Toolbar, and WebSocket communication
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import UserList from './components/UserList';
import { useWebSocket } from './hooks/useWebSocket';
import { getRandomColor } from './utils/canvas';
import { isLightColor } from './utils/color';
import './App.css';

function App() {
    // Get room ID from URL query parameter
    const getRoomId = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('room') || 'default';
    };

    const [roomId] = useState(getRoomId());
    const [color, setColor] = useState('#6366f1');
    const [tool, setTool] = useState('brush');
    const [backgroundColor, setBackgroundColor] = useState('#0f0f1e');
    const [lineWidth, setLineWidth] = useState(5);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [remoteCursors, setRemoteCursors] = useState({});

    // Assign consistent colors to users
    const userColorsRef = useRef({});
    const getUserColor = (userId) => {
        if (!userColorsRef.current[userId]) {
            userColorsRef.current[userId] = getRandomColor();
        }
        return userColorsRef.current[userId];
    };

    // WebSocket connection
    const { isConnected, userCount, emit, on, socket } = useWebSocket(roomId);

    // Canvas event handlers reference
    const canvasHandlersRef = useRef({});

    // Setup WebSocket event listeners
    useEffect(() => {
        // History received from server
        on.history((history) => {
            console.log('[App] History received, calling handler');
            if (canvasHandlersRef.current.onHistory) {
                canvasHandlersRef.current.onHistory(history);
            }
            setCanUndo(history.length > 0);
        });

        // Draw event from other users
        on.draw((path) => {
            console.log('[App] Draw event received');
            if (canvasHandlersRef.current.onDraw) {
                canvasHandlersRef.current.onDraw(path);
            }
            setCanUndo(true);
            setCanRedo(false);
        });

        // Drawing progress from other users
        on.drawingProgress((path) => {
            if (canvasHandlersRef.current.onDrawingProgress) {
                canvasHandlersRef.current.onDrawingProgress(path);
            }
        });

        // Undo event - Global update
        on.undo((data) => {
            console.log('[App] Undo event received:', data);

            if (canvasHandlersRef.current.onUndo) {
                console.log('[App] Calling canvas onUndo handler');
                canvasHandlersRef.current.onUndo(data);
            }

            // Always update undo/redo state as it is now global
            setCanUndo(data.canUndo ?? false);
            setCanRedo(data.canRedo ?? false);
        });

        // Redo event - Global update
        on.redo((data) => {
            if (canvasHandlersRef.current.onRedo) {
                canvasHandlersRef.current.onRedo(data);
            }
            // Always update state
            setCanUndo(data.canUndo ?? false);
            setCanRedo(data.canRedo ?? false);
        });

        // Clear event
        on.clear((data) => {
            if (canvasHandlersRef.current.onClear) {
                canvasHandlersRef.current.onClear(data);
            }

            // Only disable undo/redo if WE cleared our canvas
            if (data && data.userId === socket?.id) {
                setCanUndo(false);
                setCanRedo(false);
            }
        });

        // Room info
        on.roomInfo((data) => {
            // Room info doesn't have per-user state anymore
            // We'll rely on draw events to update canUndo
        });

        // Cursor move event
        on.cursorMove((data) => {
            const { userId, position, isDrawing } = data;
            setRemoteCursors((prev) => ({
                ...prev,
                [userId]: {
                    position,
                    isDrawing,
                    color: getUserColor(userId),
                },
            }));
        });

        // User left - remove their cursor
        on.userLeft((data) => {
            setRemoteCursors((prev) => {
                const updated = { ...prev };
                delete updated[data.userId];
                return updated;
            });
        });
    }, [on, getUserColor, socket]);

    // Handle drawing from canvas
    const handleDraw = useCallback((path) => {
        emit.draw(path);
    }, [emit]);

    // Handle drawing progress
    const handleDrawingProgress = useCallback((path) => {
        emit.drawingProgress(path);
    }, [emit]);

    // Keep the emit handler updated in the ref
    useEffect(() => {
        canvasHandlersRef.current.emit = handleDraw;
        canvasHandlersRef.current.emitProgress = handleDrawingProgress;
    }, [handleDraw, handleDrawingProgress]);

    // Handle undo
    const handleUndo = () => {
        emit.undo();
    };

    // Handle redo
    const handleRedo = () => {
        emit.redo();
    };

    // Handle clear canvas
    const handleClear = () => {
        const confirmed = window.confirm(
            'Clear your drawings? This action cannot be undone.'
        );
        if (confirmed) {
            emit.clearCanvas();
        }
    };

    // Handle cursor movement
    const handleCursorMove = (position) => {
        emit.cursorMove(position, position.isDrawing);
    };

    // Dynamic styles for better contrast on light backgrounds
    const isLightBg = isLightColor(backgroundColor);
    const uiStyle = isLightBg ? {
        '--text-primary': '#111827',
        '--text-secondary': '#4b5563',
        '--bg-glass': 'rgba(255, 255, 255, 0.7)',
        '--border-color': 'rgba(0, 0, 0, 0.1)',
        '--bg-tertiary': 'rgba(0, 0, 0, 0.05)',
    } : {};

    return (
        <div className="app" style={uiStyle}>
            {/* Header */}
            <header className="app-header">
                <div className="logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19l7-7 3 3-7 7-3-3z" />
                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                        <path d="M2 2l7.586 7.586" />
                        <circle cx="11" cy="11" r="2" />
                    </svg>
                    <h1 className="gradient-text">Collaborative Canvas</h1>
                </div>

                {roomId !== 'default' && (
                    <div className="room-badge glass-effect">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                        </svg>
                        Room: {roomId}
                    </div>
                )}
            </header>

            {/* Main Canvas */}
            <Canvas
                tool={tool}
                color={color}
                backgroundColor={backgroundColor}
                lineWidth={lineWidth}
                onDraw={canvasHandlersRef.current}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
                canUndo={canUndo}
                canRedo={canRedo}
                remoteCursors={remoteCursors}
                onCursorMove={handleCursorMove}
            />

            {/* Toolbar */}
            <Toolbar
                tool={tool}
                onToolChange={setTool}
                color={color}
                onColorChange={setColor}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                lineWidth={lineWidth}
                onLineWidthChange={setLineWidth}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
                canUndo={canUndo}
                canRedo={canRedo}
                isConnected={isConnected}
            />

            {/* User List */}
            <UserList userCount={userCount} isConnected={isConnected} />

            {/* Instructions */}
            <div className="instructions glass-effect">
                <h3>Quick Guide</h3>
                <ul>
                    <li><strong>Draw:</strong> Click and drag on the canvas</li>
                    <li><strong>Undo:</strong> Ctrl+Z or click undo button</li>
                    <li><strong>Redo:</strong> Ctrl+Y or click redo button</li>
                    <li><strong>Share:</strong> Copy the URL to collaborate with others</li>
                </ul>
            </div>

            {/* Connection overlay */}
            {!isConnected && (
                <div className="connection-overlay">
                    <div className="connection-message glass-effect">
                        <div className="spinner" />
                        <h2>Connecting to server...</h2>
                        <p>Please wait while we establish a connection</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
